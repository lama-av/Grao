# Teste automático do v0.1 em Chrome sem tela (Playwright). Uso: python tests/smoke_test.py
# Ajuste executable_path para o seu Chrome.
import asyncio, subprocess, time, sys
from playwright.async_api import async_playwright
import os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
srv=subprocess.Popen([sys.executable,'-m','http.server','8765','-d',ROOT],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
time.sleep(1)
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1440,'height':960})
    logs=[]
    pg.on('console',lambda m: logs.append(f'{m.type}: {m.text}'))
    pg.on('pageerror',lambda e: logs.append(f'PAGEERROR: {e}'))
    await pg.goto('http://localhost:8765/index.html')
    await pg.wait_for_timeout(1500)
    print('fail?', await pg.locator('.fail').count())
    box=await pg.locator('#wet').bounding_box()
    # pen stroke via CDP-free synthetic pointer events
    js='''([x0,y0,x1,y1,type,id,buttons])=>{const c=document.getElementById('wet');
      const ev=(t,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:id,pointerType:type,clientX:x,clientY:y,pressure:.7,buttons:t==='pointerup'?0:buttons,button:0,bubbles:true}));
      ev('pointerdown',x0,y0);for(let i=1;i<=20;i++)ev('pointermove',x0+(x1-x0)*i/20,y0+(y1-y0)*i/20);ev('pointerup',x1,y1);}'''
    cx,cy,w,h=box['x'],box['y'],box['width'],box['height']
    await pg.evaluate(js,[cx+w*.3,cy+h*.3,cx+w*.7,cy+h*.6,'pen',1,1])
    await pg.wait_for_timeout(300)
    st=await pg.evaluate("()=>{const a=window.grao;const L=a.project.layers[0];return {strokes:L.frames.map(f=>f.length),t:a.clock.t,low:a.lowLatency,depth:a.history.depth}}")
    print('after pen', st)
    # pause, auto step
    await pg.evaluate("()=>{window.grao.clock.paused=true}")
    f0=await pg.evaluate("()=>window.grao.clock.frameOf(window.grao.project.layers[0])")
    await pg.evaluate(js,[cx+w*.2,cy+h*.2,cx+w*.4,cy+h*.2,'pen',2,1])
    f1=await pg.evaluate("()=>window.grao.clock.frameOf(window.grao.project.layers[0])")
    print('auto step', f0,'->',f1)
    # touch single finger should not draw
    n0=await pg.evaluate("()=>window.grao.project.layers[0].frames.flat().length")
    await pg.evaluate(js,[cx+w*.5,cy+h*.5,cx+w*.6,cy+h*.6,'touch',9,1])
    n1=await pg.evaluate("()=>window.grao.project.layers[0].frames.flat().length")
    print('touch draws?', n0, n1)
    # lasso: hold button then lasso around first stroke on frame of first stroke
    await pg.evaluate("()=>{const a=window.grao;const L=a.project.layers[0];const i=L.frames.findIndex(f=>f.some(s=>s.pts[0]>300));a.clock.t=(i+0.5)/L.fps;}")
    lb=await pg.locator('#lasso').bounding_box()
    await pg.evaluate('''(b)=>{const el=document.getElementById('lasso');el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:20,pointerType:'touch',clientX:b.x+5,clientY:b.y+5,bubbles:true}))}''',lb)
    ff=await pg.evaluate("()=>[window.grao.clock.frozen, window.grao.lassoHeld]")
    print('lasso frozen/held', ff)
    poly=[(.25,.25),(.75,.25),(.75,.65),(.25,.65),(.25,.25)]
    await pg.evaluate('''([pts])=>{const c=document.getElementById('wet');const ev=(t,x,y)=>c.dispatchEvent(new PointerEvent(t,{pointerId:3,pointerType:'pen',clientX:x,clientY:y,pressure:.5,buttons:t==='pointerup'?0:1,bubbles:true}));
      ev('pointerdown',...pts[0]);pts.forEach(p=>ev('pointermove',...p));ev('pointerup',...pts[pts.length-1]);}''',[[[cx+w*x,cy+h*y] for x,y in poly]])
    await pg.evaluate('''()=>{const el=document.getElementById('lasso');el.dispatchEvent(new PointerEvent('pointerup',{pointerId:20,pointerType:'touch',bubbles:true}))}''')
    print('dbg', await pg.evaluate("()=>{const a=window.grao;const L=a.project.layers[0];return {f:a.clock.frameOf(L), frames:L.frames.map(f=>f.map(s=>s.pts.length)), t:a.clock.t, lasso:a.lassoHeld}}"))
    sel=await pg.evaluate("()=>{const s=window.grao.selection;return s?{l:s.l,f:s.f,n:s.ids.size,frozen:window.grao.clock.frozen}:null}")
    print('selection', sel)
    # move selection with pen
    before=await pg.evaluate("()=>{const s=window.grao.selection;return window.grao.project.layers[s.l].frames[s.f][0].pts[0]}")
    await pg.evaluate(js,[cx+w*.5,cy+h*.45,cx+w*.55,cy+h*.45,'pen',4,1])
    after=await pg.evaluate("()=>{const s=window.grao.selection;return window.grao.project.layers[s.l].frames[s.f][0].pts[0]}")
    print('move x', round(before,1),'->',round(after,1))
    await pg.click('#dup'); 
    print('dup', await pg.evaluate("()=>window.grao.project.layers[0].frames.map(f=>f.length)"))
    # undo via 2-finger tap
    await pg.evaluate('''([x,y])=>{const c=document.getElementById('wet');const d=(t,id,x)=>c.dispatchEvent(new PointerEvent(t,{pointerId:id,pointerType:'touch',clientX:x,clientY:y,bubbles:true}));
       d('pointerdown',30,x);d('pointerdown',31,x+300);d('pointerup',30,x);d('pointerup',31,x+300);}''',[cx+20,cy+h-40])
    print('after 2-finger undo', await pg.evaluate("()=>window.grao.project.layers[0].frames.map(f=>f.length)"))
    # wheel step
    await pg.evaluate("()=>{window.grao.historyUntil=0; window.grao.selection=null; window.grao.onSelectionChange(); window.grao.clock.paused=true; window.grao.clock.t=0}")
    wb=await pg.locator('#wheel').bounding_box()
    await pg.evaluate('''(b)=>{const el=document.getElementById('wheel');const R=b.width/2,cx=b.x+R,cy=b.y+R;const ev=(t,a)=>el.dispatchEvent(new PointerEvent(t,{pointerId:40,pointerType:'touch',clientX:cx+Math.cos(a)*R*.8,clientY:cy+Math.sin(a)*R*.8,bubbles:true}));
      ev('pointerdown',0);for(let i=1;i<=10;i++)ev('pointermove',i*0.1*Math.PI/180*95);ev('pointerup',95*Math.PI/180);}''',wb)
    print('wheel frame', await pg.evaluate("()=>window.grao.clock.frameOf(window.grao.project.layers[0])"), 'frozen after', await pg.evaluate("()=>window.grao.clock.holds.size"))
    await pg.evaluate("()=>{window.grao.clock.paused=false}")
    await pg.wait_for_timeout(1200)
    print('readout', await pg.inner_text('#readout'))
    await pg.click('#more'); await pg.check('#debug'); await pg.wait_for_timeout(1100)
    print(await pg.inner_text('#debugbox'))
    await pg.screenshot(path='shot.png')
    # reload: persisted?
    await pg.wait_for_timeout(800)
    await pg.reload(); await pg.wait_for_timeout(1500)
    print('after reload', await pg.evaluate("()=>window.grao.project.layers[0].frames.map(f=>f.length)"))
    print('\n'.join(logs) or 'no console output')
    await b.close()
asyncio.run(main()); srv.terminate()
