import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const b=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{const c=await b.newContext(),p=await c.newPage();const failed=[];p.on('requestfailed',r=>failed.push(r.url()));await p.goto(process.env.CALC_URL||'http://127.0.0.1:4176/');await p.evaluate(async()=>{await navigator.serviceWorker.ready;return true});await p.reload();assert.equal(await p.evaluate(()=>!!navigator.serviceWorker.controller),true);await c.setOffline(true);await p.reload();for(const key of ['7','+','8','equals'])await p.locator(`[data-action="${key}"]`).click();assert.equal(await p.locator('#result').innerText(),'15');assert.deepEqual(failed,[]);console.log('Offline reload, assets, font and calculation passed');}finally{await b.close()}
