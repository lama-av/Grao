#version 300 es
// Motor riso do Grão v0.1 — uma passada.
// Etapas (docs/05-motor-riso.md): desalinhamento por tinta, trama (grão), borda orgânica,
// película irregular e composição multiplicativa sobre o papel com fibras.
// A sobreimpressão (tinta clara sob a escura) fica para a próxima versão.
// Ruído medido em unidades do documento: exportar em outra resolução não muda o grão.
precision highp float;

uniform vec2 uRes;            // pixels do canvas
uniform vec2 uDoc;            // tamanho do documento (1200, 800)
uniform sampler2D uMask0;
uniform sampler2D uMask1;
uniform sampler2D uMask2;
uniform sampler2D uMask3;
uniform sampler2D uPrev;      // onion skin: frame anterior da camada ativa
uniform sampler2D uNext;      // onion skin: frame seguinte
uniform vec3 uInk[4];
uniform float uOpac[4];
uniform vec2 uOff[4];         // desalinhamento por tinta (em uv)
uniform vec3 uPaper;
uniform float uFiber;
uniform float uIncl;
uniform float uTex;
uniform float uGrain;         // 0 a 1
uniform float uSeed;          // muda a cada reimpressão ("ferver")
uniform float uOnion;         // 0 ou 1

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

// Cobertura impressa de uma tinta neste ponto (0 = papel, 1 = tinta cheia).
float inkLayer(sampler2D m, vec2 uv, vec2 dp, float s) {
  float c = texture(m, uv).r;
  if (c <= 0.002) return 0.0;
  vec2 o = vec2(s * 17.13, s * 9.71);
  float n  = vnoise(dp * 0.55 + o);          // grão em cachos (~2 unidades)
  float n2 = vnoise(dp * 0.11 + o * 0.37);   // manchas maiores da película
  float e = c + (n - 0.5) * 0.75 * uGrain;   // borda orgânica e pontilhado nos tons
  float k = smoothstep(0.40, 0.60, e);
  float voids = smoothstep(0.82, 0.97, h12(floor(dp * 0.8) + o)) * uGrain * 0.85;
  k *= 1.0 - voids;                          // micro-falhas de tinta
  k *= 1.0 - uGrain * 0.22 * n2;             // espessura irregular
  return clamp(k, 0.0, 1.0);
}

void main() {
  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1.0 - gl_FragCoord.y / uRes.y);
  vec2 dp = uv * uDoc;

  // Papel: cor, textura, fibras horizontais e impurezas.
  float t = vnoise(dp * 0.9) * 0.6 + vnoise(dp * 0.07) * 0.4;
  vec3 col = uPaper * (1.0 + uTex * 0.06 * (t - 0.5) * 2.0);
  float fib = smoothstep(0.64, 0.72, vnoise(vec2(dp.x * 0.07, dp.y * 1.3)));
  col *= 1.0 - uFiber * 0.06 * fib;
  float inc = smoothstep(0.988, 1.0, h12(floor(dp * 0.5)));
  col = mix(col, col * 0.72, uIncl * inc);

  // Onion skin quando o loop está congelado.
  if (uOnion > 0.5) {
    float a = texture(uPrev, uv).r;
    float b = texture(uNext, uv).r;
    col = mix(col, col * vec3(0.72, 0.84, 1.0), a * 0.4);
    col = mix(col, col * vec3(1.0, 0.78, 0.78), b * 0.4);
  }

  // Tintas multiplicadas sobre o papel.
  float k;
  k = inkLayer(uMask0, uv + uOff[0], dp, uSeed + 1.0); col *= mix(vec3(1.0), uInk[0], k * uOpac[0]);
  k = inkLayer(uMask1, uv + uOff[1], dp, uSeed + 2.0); col *= mix(vec3(1.0), uInk[1], k * uOpac[1]);
  k = inkLayer(uMask2, uv + uOff[2], dp, uSeed + 3.0); col *= mix(vec3(1.0), uInk[2], k * uOpac[2]);
  k = inkLayer(uMask3, uv + uOff[3], dp, uSeed + 4.0); col *= mix(vec3(1.0), uInk[3], k * uOpac[3]);

  outColor = vec4(col, 1.0);
}
