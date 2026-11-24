# Teste automático do Grão (v0.2, roda de canto) em Chrome sem tela (Playwright).
# Uso: pip install playwright  →  python tests/smoke_test.py
# Caminho do Chrome: variável de ambiente CHROME (padrão: /usr/bin/google-chrome).
# Todos os toques são PointerEvents sintéticos no #wet, que repassa à roda os que caem na área dela.
import asyncio, subprocess, time, sys, os
from playwright.async_api import async_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CHROME = os.environ.get('CHROME', '/usr/bin/google-chrome')
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '-d', ROOT], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
fails = []

def check(name, ok, info=''):
    print(('OK   ' if ok else 'FALHA') + f' {name} {info}')
    if not ok: fails.append(name)

# Gera eventos: tipo, id, lista de pontos (x, y); pressiona no primeiro e solta no último.
DRAG = '''([type,id,pts,buttons])=>{const c=document.getElementById('wet');
  const ev=(t,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:id,pointerType:type,clientX:x,clientY:y,pressure:.7,
    buttons:t==='pointerup'?0:(buttons||1),button:0,bubbles:true}));
  ev('pointerdown',...pts[0]);for(const p of pts.slice(1))ev('pointermove',...p);ev('pointerup',...pts[pts.length-1]);}'''

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=CHROME, args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'])
        pg = await b.new_page(viewport={'width': 1080, 'height': 720})
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto('http://localhost:8765/index.html')
        await pg.wait_for_timeout(1500)
        check('abriu sem erro', await pg.locator('.fail').count() == 0)

        box = await pg.locator('#wet').bounding_box()
        X, Y, W, H = box['x'], box['y'], box['width'], box['height']
        check('papel em tela cheia', abs(W - 1080) < 2 and abs(H - 720) < 2, f'{W}x{H}')
        g = lambda js: pg.evaluate(js)
        drag = lambda t, i, pts, bt=1: pg.evaluate(DRAG, [t, i, pts, bt])
        tap = lambda t, i, x, y: drag(t, i, [(x, y)])
        BTN = (X + 48, Y + H - 48)                   # botão recolhido (canto inferior esquerdo)
        WC = (X + 136, Y + H - 136)                  # centro da roda aberta
        import math
        def at(r, a):                                # ponto da roda em raio r e ângulo a (graus, y para baixo)
            return (WC[0] + math.cos(math.radians(a)) * r, WC[1] + math.sin(math.radians(a)) * r)

        # desenhar com a caneta
        await drag('pen', 1, [(X + W * .3 + i * 20, Y + H * .3 + i * 10) for i in range(20)])
        n = await g("()=>window.grao.project.layers[0].frames.flat().length")
        check('caneta desenha', n == 1, n)
        # 1 dedo não desenha
        await drag('touch', 9, [(X + W * .5 + i * 5, Y + H * .5) for i in range(10)])
        check('1 dedo não desenha', await g("()=>window.grao.project.layers[0].frames.flat().length") == n)

        # abrir a roda pelo botão
        await tap('touch', 20, *BTN)
        await pg.wait_for_timeout(200)
        # centro: tocar/pausar
        await g("()=>{window.grao.clock.paused=false}")
        await tap('touch', 21, *WC)
        check('centro pausa', await g("()=>window.grao.clock.paused") is True)
        # prato: girar 95° anda 3 frames e segura o loop enquanto encosta
        await g("()=>{window.grao.clock.t=0}")
        pts = [at(100, -90 + i * 9.5) for i in range(11)]
        await pg.evaluate('''([pts])=>{const c=document.getElementById('wet');const ev=(t,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:22,pointerType:'touch',clientX:x,clientY:y,bubbles:true}));
          ev('pointerdown',...pts[0]);for(const p of pts.slice(1))ev('pointermove',...p);}''', [pts])
        check('prato segura o loop', await g("()=>window.grao.clock.holds.has('wheel')"))
        await pg.evaluate('''([x,y])=>document.getElementById('wet').dispatchEvent(new PointerEvent('pointerup',{pointerId:22,pointerType:'touch',clientX:x,clientY:y,bubbles:true}))''', list(pts[-1]))
        f = await g("()=>window.grao.clock.frameOf(window.grao.project.layers[0])")
        check('prato anda 3 frames', f == 3, f)
        check('soltar o prato solta o loop', await g("()=>window.grao.clock.holds.size") == 0)

        # desfazer e refazer pela roda (setores em -120° e -60°)
        await tap('touch', 23, *at(58, -120))
        check('Desfazer pela roda', await g("()=>window.grao.project.layers[0].frames.flat().length") == 0)
        await tap('touch', 24, *at(58, -60))
        check('Refazer pela roda', await g("()=>window.grao.project.layers[0].frames.flat().length") == 1)

        # pétala Tinta (180°): ativar a 2ª tinta
        await tap('touch', 25, *at(58, 180))
        step, base = 17, -45
        start = base - step * 1.5
        await tap('touch', 26, *at(206, start + step))
        check('trocar tinta', await g("()=>window.grao.project.activeLayer") == 1)

        # pétala Ferramenta (0°): Pincel, Lápis, Marcador, Giz, Borracha, Balde, Laço
        await tap('touch', 27, *at(58, 0))
        await tap('touch', 28, *at(206, base - step * 3 + step * 4))   # 7 ferramentas; Borracha é a 5ª
        check('escolher Borracha', await g("()=>window.grao.tool") == 'eraser')
        await g("()=>{window.grao.tool='brush'}")

        # recolhe ao desenhar
        await drag('pen', 2, [(X + W * .6, Y + H * .2), (X + W * .7, Y + H * .25)])
        await pg.wait_for_timeout(200)
        await tap('touch', 29, *at(58, -120))          # se recolheu, este toque cai no papel (não desfaz)
        check('roda recolhe ao desenhar', await g("()=>window.grao.history.canUndo") is True)

        # mover de canto: segurar 0,4 s e arrastar até o canto superior direito
        await pg.evaluate('''([x,y])=>document.getElementById('wet').dispatchEvent(new PointerEvent('pointerdown',{pointerId:30,pointerType:'touch',clientX:x,clientY:y,bubbles:true}))''', list(BTN))
        await pg.wait_for_timeout(500)
        await pg.evaluate('''([x,y,x2,y2])=>{const c=document.getElementById('wet');
          c.dispatchEvent(new PointerEvent('pointermove',{pointerId:30,pointerType:'touch',clientX:x2,clientY:y2,bubbles:true}));
          c.dispatchEvent(new PointerEvent('pointerup',{pointerId:30,pointerType:'touch',clientX:x2,clientY:y2,bubbles:true}));}''', [*BTN, X + W - 60, Y + 60])
        check('mover para outro canto', await g("()=>window.grao.project.settings.wheelCorner") == 'tr')
        await g("()=>{window.grao.project.settings.wheelCorner=null}")

        # desfazer com 2 dedos
        before = await g("()=>window.grao.history.depth")
        await pg.evaluate('''([x,y])=>{const c=document.getElementById('wet');const d=(t,id,x)=>c.dispatchEvent(new PointerEvent(t,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true}));
           d('pointerdown',40,x);d('pointerdown',41,x+300);d('pointerup',40,x);d('pointerup',41,x+300);}''', [X + W * .4, Y + H * .5])
        check('desfazer com 2 dedos', await g("()=>window.grao.history.depth") == before - 1)

        # laço fixo + chips
        await g("()=>{const a=window.grao;a.project.activeLayer=0;a.clock.paused=true;a.tool='lasso';const L=a.project.layers[0];const i=L.frames.findIndex(f=>f.length);a.clock.t=(i+0.5)/L.fps;}")
        poly = [(.2, .2), (.8, .2), (.8, .7), (.2, .7), (.2, .2)]
        await drag('pen', 3, [(X + W * x, Y + H * y) for x, y in poly])
        sel = await g("()=>window.grao.selection&&window.grao.selection.ids.size")
        check('laço seleciona', bool(sel), sel)
        chip = await g('''()=>{const a=window.grao,b=a.input.selectionBounds(),k=document.getElementById('wet').getBoundingClientRect().width/1200;return [b.x0*k,b.y1*k]}''')
        frames0 = await g("()=>window.grao.project.layers[0].frames.map(f=>f.length).join(',')")
        await tap('touch', 42, X + max(8, chip[0]) + 30, Y + chip[1] + 10 + 24)
        frames1 = await g("()=>window.grao.project.layers[0].frames.map(f=>f.length).join(',')")
        check('chip Duplicar →', frames0 != frames1, f'{frames0} -> {frames1}')
        await g("()=>{window.grao.tool='brush'}")

        await pg.screenshot(path=os.path.join(ROOT, 'tests', 'shot.png'))
        await pg.wait_for_timeout(800)
        await pg.reload(); await pg.wait_for_timeout(1500)
        check('salvo depois de recarregar', await g("()=>window.grao.project.layers[0].frames.flat().length") >= 1)
        errors = [l for l in logs if 'PAGEERROR' in l or l.startswith('error')]
        check('sem erros no console', not errors, '\n'.join(errors))
        await b.close()

asyncio.run(main()); srv.terminate()
print('\n' + ('TUDO OK' if not fails else f'{len(fails)} FALHA(S): ' + ', '.join(fails)))
sys.exit(1 if fails else 0)
