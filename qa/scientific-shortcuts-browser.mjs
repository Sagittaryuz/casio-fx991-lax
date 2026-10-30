import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:393,height:852},hasTouch:true});await page.goto(process.env.CALC_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});const key=async a=>page.locator(`[data-action="${a}"]`).first().click();const field=page.locator('#expression'),result=page.locator('#result');
 for(const a of ['shift','power','3','right','right','8','equals'])await key(a);assert.equal(await result.getAttribute('aria-label'),'2');
 await key('clear');for(const a of ['shift','negative','2','right','right','8','equals'])await key(a);assert.equal(await result.getAttribute('aria-label'),'3');
 await key('clear');for(const a of ['6','0','equals','shift','dms'])await key(a);assert.equal(await result.getAttribute('aria-label'),'2^2 × 3 × 5');
 await key('clear');for(const a of ['1','2','3','4','equals','eng'])await key(a);assert.equal(await result.getAttribute('aria-label'),'1,234×10^3');
 await key('shift');await key('menu');await key('2');await key('3');await key('shift');await key('menu');await key('3');await key('1');await key('2');assert.equal(await page.locator('#mode').textContent(),'G');await page.reload();assert.equal(await page.locator('#mode').textContent(),'G');
 await key('clear');await field.evaluate(e=>{e.value='x^2+Ax+B';e.dispatchEvent(new Event('input',{bubbles:true}))});await key('shift');await key('calc');await page.locator('.calc-solve:visible [data-variable=x]').fill('-5');await page.locator('.calc-solve:visible [data-variable=A]').fill('5');await page.locator('.calc-solve:visible [data-variable=B]').fill('6');await page.locator('.calc-solve:visible button',{hasText:'Calcular'}).click();assert.match(await page.locator('.calc-solve:visible [data-calc-result]').textContent(),/x = -3/);await page.locator('.calc-solve:visible button',{hasText:'Usar resultado'}).click();assert.equal(await result.getAttribute('aria-label'),'-3,00');
 await key('clear');await field.evaluate(e=>{e.value='sqrt(-1)';e.dispatchEvent(new Event('input',{bubbles:true}))});await key('calc');await page.locator('.calc-solve:visible button',{hasText:'Calcular'}).click();assert.match(await page.locator('.calc-solve:visible [data-calc-result]').textContent(),/Erro/);await page.locator('.close-mode').click();assert.equal(await field.inputValue(),'sqrt(-1)');
 console.log('Scientific shortcuts, settings, SOLVE and cancellation passed');
}finally{await browser.close()}
