#version 300 es
// Motor riso do Grão (v0.4) — uma passada, até 8 camadas e 4 tintas (tambores).
// Etapas (docs/05-motor-riso.md): desalinhamento por tinta, retícula por camada (estocástica ou reticulada),
// borda orgânica, película irregular e composição multiplicativa sobre o papel com fibras.
// Camadas da mesma tinta se juntam (o mesmo tambor não escurece onde se sobrepõe); tintas diferentes multiplicam.
// Ruído e retícula medidos em unidades do documento: exportar em outra resolução não muda o grão.
precision highp float;

uniform vec2 uRes;            // pixels do canvas
uniform vec2 uDoc;            // tamanho do documento (1200, 800)
uniform sampler2D uMask0;
uniform sampler2D uMask1;
uniform sampler2D uMask2;
uniform sampler2D uMask3;
uniform sampler2D uMask4;
uniform sampler2D uMask5;
uniform sampler2D uMask6;
uniform sampler2D uMask7;
uniform sampler2D uPrev;      // papel-cebola: frame anterior da camada ativa
uniform sampler2D uNext;      // papel-cebola: frame seguinte
uniform float uLayerOn[8];    // 1 = camada existe e está visível
uniform float uLayerInk[8];   // tambor da camada (0..3)
uniform float uLayerType[8];  // retícula: 0 = estocástica, 1 = reticulada
uniform float uLayerDens[8];  // densidade da retícula (0,05..1)
uniform vec3 uInk[4];         // cor de cada tambor
uniform vec2 uOff[4];         // desalinhamento por tambor (em uv)
uniform float uAngle[4];      // ângulo da reticulada por tambor (radianos)
uniform float uCell;          // célula da reticulada, em unidades do documento (lineatura)
uniform float uPxDoc;         // unidades do documento por pixel da tela (borda suave do ponto, sem derivadas)
uniform vec3 uPaper;
uniform float uFiber;
uniform float uIncl;
uniform float uTex;
uniform float uGrain;         // 0 a 1
uniform float uSeed;          // muda a cada reimpressão ("ferver")
uniform float uOnion;         // 0 ou 1
uniform vec3 uView;           // zoom e posição: (s, ox, oy) em uv da tela (src/view.js)

out vec4 outColor;

float h12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = h12(i);
  float b = h12(i + vec2(1.0, 0.0));
  float c = h12(i + vec2(0.0, 1.0));
  float d = h12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Cobertura impressa de uma camada neste ponto (0 = papel, 1 = tinta cheia).
// c = valor da máscara (tom do traço), dp = ponto em unidades do documento, s = semente da camada.
float coverage(float c, vec2 dp, float s, float type, float dens, float ang) {
  if (c <= 0.002) return 0.0;
  vec2 o = vec2(s * 17.13, s * 9.71);
  float n  = vnoise(dp * 0.55 + o);          // grão em cachos (~2 unidades)
  float n2 = vnoise(dp * 0.11 + o * 0.37);   // manchas maiores da película
  float k;
  vec2 cellId;
  if (type < 0.5) {
    // Estocástica: borda orgânica do grão; a densidade decide quantos cachos de tinta sobram.
    float e = c + (n - 0.5) * 0.75 * uGrain;
    k = smoothstep(0.40, 0.60, e);
    float m = vnoise(dp * 0.9 + o * 1.7);
    k *= 1.0 - smoothstep(dens - 0.06, dens + 0.06, m) * step(dens, 0.999);
    cellId = floor(dp * 0.9);
  } else {
    // Reticulada: grade girada pelo ângulo da tinta; ponto redondo com área = tom (c × densidade).
    float ca = cos(ang), sa = sin(ang);
    vec2 g = mat2(ca, sa, -sa, ca) * dp / uCell;
    cellId = floor(g);
    vec2 f = fract(g) - 0.5;
    float t = clamp(c * dens, 0.0, 1.0);
    float r = sqrt(t / 3.14159265);
    float aa = 0.75 * uPxDoc / uCell;        // meio pixel, em células: borda suave sem moiré duro
    k = 1.0 - smoothstep(r - aa, r + aa, length(f));   // limites em ordem crescente (GLSL: invertido é indefinido)
    k *= clamp(r / aa, 0.0, 1.0);            // ponto menor que um pixel: desbota em vez de escurecer o tom
    k = max(k, smoothstep(0.80, 0.97, t));   // tons muito altos: os pontos se juntam em área cheia
  }
  // Abaixo de 10% a riso falha: parte dos pontos cai ao acaso (muda com o ferver).
  float drop = clamp((0.10 - dens) / 0.10, 0.0, 1.0) * 0.6;
  k *= step(drop, h12(cellId + o * 3.1));
  // Micro-falhas de tinta.
  float voids = smoothstep(0.82, 0.97, h12(floor(dp * 0.8) + o)) * uGrain * 0.85;
  k *= 1.0 - voids;
  // Película irregular; áreas cheias imprimem desiguais (cresce de 50% a forte acima de 85%).
  float full = smoothstep(0.5, 0.95, c * dens);
  k *= 1.0 - uGrain * 0.22 * n2 - full * 0.16 * n2;
  return clamp(k, 0.0, 1.0);
}

vec4 drumMask(float ink) {
  return vec4(equal(vec4(floor(ink + 0.5)), vec4(0.0, 1.0, 2.0, 3.0)));
}

// Uma camada: lê a máscara com o desalinhamento do seu tambor; devolve a cobertura no canal do tambor.
vec4 layerK(sampler2D M, int i, vec2 uv, vec2 dp) {
  int d = int(uLayerInk[i] + 0.5);
  float k = coverage(texture(M, uv + uOff[d]).r, dp, uSeed + float(i) + 1.0, uLayerType[i], uLayerDens[i], uAngle[d]);
  return k * drumMask(uLayerInk[i]);
}

void main() {
  vec2 st = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);   // ponto da tela (0..1)
  vec2 uv = (st - uView.yz) / uView.x;    // ponto do papel sob este pixel (zoom)
  vec2 dp = uv * uDoc;

  // Papel: cor, textura, fibras horizontais e impurezas.
  float t = vnoise(dp * 0.9) * 0.6 + vnoise(dp * 0.07) * 0.4;
  vec3 col = uPaper * (1.0 + uTex * 0.06 * (t - 0.5) * 2.0);
  float fib = smoothstep(0.64, 0.72, vnoise(vec2(dp.x * 0.07, dp.y * 1.3)));
  col *= 1.0 - uFiber * 0.06 * fib;
  float inc = smoothstep(0.988, 1.0, h12(floor(dp * 0.5)));
  col = mix(col, col * 0.72, uIncl * inc);

  // Papel-cebola quando o loop está congelado.
  if (uOnion > 0.5) {
    float a = texture(uPrev, uv).r;
    float b = texture(uNext, uv).r;
    col = mix(col, col * vec3(0.72, 0.84, 1.0), a * 0.4);
    col = mix(col, col * vec3(1.0, 0.78, 0.78), b * 0.4);
  }

  // Cobertura por tambor, depois as 4 tintas multiplicadas sobre o papel.
  vec4 kd = vec4(0.0);
  if (uLayerOn[0] > 0.5) kd = max(kd, layerK(uMask0, 0, uv, dp));
  if (uLayerOn[1] > 0.5) kd = max(kd, layerK(uMask1, 1, uv, dp));
  if (uLayerOn[2] > 0.5) kd = max(kd, layerK(uMask2, 2, uv, dp));
  if (uLayerOn[3] > 0.5) kd = max(kd, layerK(uMask3, 3, uv, dp));
  if (uLayerOn[4] > 0.5) kd = max(kd, layerK(uMask4, 4, uv, dp));
  if (uLayerOn[5] > 0.5) kd = max(kd, layerK(uMask5, 5, uv, dp));
  if (uLayerOn[6] > 0.5) kd = max(kd, layerK(uMask6, 6, uv, dp));
  if (uLayerOn[7] > 0.5) kd = max(kd, layerK(uMask7, 7, uv, dp));
  col *= mix(vec3(1.0), uInk[0], kd.x);
  col *= mix(vec3(1.0), uInk[1], kd.y);
  col *= mix(vec3(1.0), uInk[2], kd.z);
  col *= mix(vec3(1.0), uInk[3], kd.w);

  outColor = vec4(col, 1.0);
}
