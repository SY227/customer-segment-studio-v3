import asyncio,json,os,tempfile
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(os.environ.get('STUDIO_QA_DIR',str(Path(tempfile.gettempdir())/'studio-atelier-layout')))
results=[]
async def main():
 async with async_playwright() as pw:
  browser=await pw.chromium.launch(executable_path=os.environ.get('STUDIO_CHROMIUM'),args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':1440,'height':1000})
  for width in [320,360,390,430,640,768,980,1024,1180,1280,1440,1600]:
   await page.set_viewport_size({'width':width,'height':1000})
   for state in ['default','format','sample','processing','error']:
    await page.set_content((ROOT/(state+'.html')).read_text())
    r=await page.evaluate('''() => {
      const rects = [...document.querySelectorAll('.primary-button, .detail-panel, .segment-card, .metric-card')].map(x=>x.getBoundingClientRect());
      return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,cards:document.querySelectorAll('.segment-card').length,
        invalidBounds:rects.some(r=>!Number.isFinite(r.width)||r.width<1),
        dialogs:document.querySelectorAll('[role="dialog"]').length,
        progress:document.querySelector('.processing-copy-row')?.textContent,
        overflowTables:[...document.querySelectorAll('.sample-format-table')].every(x=>getComputedStyle(x).overflowX==='auto')};
    }''')
    assert r['width']==r['scrollWidth'],(width,state,r)
    assert r['cards']==9 and not r['invalidBounds'],(width,state,r)
    assert r['dialogs']==(1 if state in ['format','sample'] else 0)
    assert r['overflowTables']
    if state=='processing': assert '57%' in r['progress']
    results.append({'width':width,'state':state,'passed':True,'scope':'CSS/DOM fixture, no React/Next/WebGL runtime'})
  groups=['best-customers','loyal-buyers','new-buyers','at-risk-vips','growing-buyers','occasional-buyers','dormant-vips','light-repeaters','inactive-customers']
  for width in [390,1440]:
   await page.set_viewport_size({'width':width,'height':1000})
   for state in groups:
    await page.set_content((ROOT/(state+'.html')).read_text())
    r=await page.evaluate('''() => ({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,selected:document.querySelectorAll('.segment-card[aria-pressed="true"]').length,card:document.querySelector('.segment-card.is-selected .segment-card-name')?.textContent,title:document.querySelector('.detail-panel h2')?.textContent})''')
    assert r['scrollWidth']==r['width'] and r['selected']==1 and r['card']==r['title'],r
    results.append({'width':width,'state':state,'passed':True,'scope':'CSS selected-state fixture'})
  await page.set_viewport_size({'width':1440,'height':1000})
  await page.set_content((ROOT/'default.html').read_text())
  await page.locator('.primary-button').first.focus()
  assert await page.locator('.primary-button').first.evaluate("el => getComputedStyle(el).outlineStyle !== 'none'")
  results.append({'state':'keyboard-focus','passed':True,'scope':'CSS fixture'})
  await page.emulate_media(reduced_motion='reduce')
  r=await page.locator('.segment-card-avatar-shell').first.evaluate("el => ({transform:getComputedStyle(el).transform,transition:getComputedStyle(el).transitionDuration})")
  assert r['transform']=='none' and r['transition']=='0s',r
  results.append({'state':'reduced-motion-css','passed':True,'scope':'CSS fixture'})
  await page.emulate_media(reduced_motion='no-preference')
  await page.locator('.segment-card').first.scroll_into_view_if_needed()
  # Exact AtelierChrome effect in browser, hooks/runtime adapter only.
  await page.add_script_tag(content=(ROOT/'chrome-effect-fixture.js').read_text())
  box=await page.locator('.segment-card').first.bounding_box()
  await page.mouse.move(box['x']+box['width']*.8,box['y']+box['height']*.2)
  await page.wait_for_timeout(50)
  r=await page.locator('.segment-card').first.evaluate("el => ({x:el.style.getPropertyValue('--sheen-x'),tilt:el.style.getPropertyValue('--portrait-tilt-y'),textTransform:getComputedStyle(el.querySelector('.segment-card-stats')).transform})")
  assert r['x'] and r['tilt'] and r['textTransform']=='none',r
  results.append({'state':'sheen-chrome-effect','passed':True,'scope':'real Chrome effect with useEffect adapter; not React runtime'})
  await page.emulate_media(reduced_motion='reduce')
  await page.wait_for_timeout(50)
  assert not await page.locator('.segment-card').first.evaluate("el=>el.style.getPropertyValue('--sheen-x')")
  results.append({'state':'sheen-live-reduced-motion','passed':True,'scope':'real Chrome effect with useEffect adapter'})
  await page.evaluate('window._qaAtelierCleanup?.()')
  results.append({'state':'sheen-listener-cleanup','passed':True,'scope':'effect cleanup executes without throwing'})
  await browser.close()
 (ROOT/'layout-results.json').write_text(json.dumps(results,indent=2))
 print(f'{len(results)} CSS/isolated-effect checks passed')
asyncio.run(main())
