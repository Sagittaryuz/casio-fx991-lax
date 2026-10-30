import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:393,height:852},hasTouch:true});
 await page.goto(process.env.CALC_URL||'http://127.0.0.1:4198/',{waitUntil:'networkidle'});
 const open=async opts=>page.evaluate(async options=>{const m=await import('/src/modes-ui.js');m.openModes({...options,onAccept:(value,details)=>{window.accepted={value,details}}})},opts);
 const active='.mode-content > div:not([hidden])';
 const physical=async a=>page.locator(`[data-action="${a}"]`).first().click();
 await open({initialMode:'solve',expression:'x',variables:{x:2,D:4}});
 for(const a of ['+','alpha','sin','alpha','calc','6'])await physical(a);
 assert.equal(await page.locator('[data-equation]').inputValue(),'x+D=6');
 assert.deepEqual(await page.locator('[data-variable]').evaluateAll(es=>es.map(e=>e.name)),['x','D']);
 await physical('equals');assert.match(await page.locator('[data-calc-result]').textContent(),/x = 2/);
 await page.locator(`${active} button`,{hasText:'Usar resultado'}).click();assert.ok(Math.abs((await page.evaluate(()=>window.accepted.value))-2)<1e-9);
 await open({initialMode:'Cálculo',initialOperation:'Integral definida',expression:'1/x'});
 await page.locator(`${active} .misc-calculate`).click();assert.match(await page.locator(`${active} [data-misc-result]`).textContent(),/0,9162907319/);
 await page.locator(`${active} button`,{hasText:'Usar resultado'}).click();assert.ok(Math.abs((await page.evaluate(()=>window.accepted.value))-Math.log(2.5))<1e-8);
 await open({initialMode:'Cálculo',initialOperation:'Pol'});await page.locator(`${active} .misc-calculate`).click();await page.locator(`${active} button`,{hasText:'Usar resultado'}).click();const polar=await page.evaluate(()=>window.accepted);assert.equal(polar.value,5);assert.ok(Math.abs(polar.details.variables.y-53.130102354)<1e-8);
 await page.evaluate(()=>window.accepted=null);await open({initialMode:'calc',expression:'sqrt(-1)'});await page.locator(`${active} button`,{hasText:'Calcular'}).click();assert.match(await page.locator(`${active} [data-calc-result]`).textContent(),/Math ERROR/);assert.equal(await page.locator(`${active} button`,{hasText:'Usar resultado'}).isDisabled(),true);await page.locator('.close-mode').click();assert.equal(await page.evaluate(()=>window.accepted),null);
 console.log('CALC/SOLVE, physical entry, calculus, Pol, domain and cancellation passed');
}finally{await browser.close()}
