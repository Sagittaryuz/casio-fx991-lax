// Run against a local Vite server, with Playwright installed and Chromium available.
import { createRequire } from 'node:module';
const require=createRequire(import.meta.url);
const { chromium }=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:393,height:852}});await page.goto(process.env.CALCULATOR_URL||'http://127.0.0.1:4184/',{waitUntil:'networkidle'});
 const key=async name=>page.locator(`[data-action="${name}"]`).first().click();
 for(const name of ['fraction','7','down','8'])await key(name);
 assert.equal(await page.locator('#expression').inputValue(),'(7)/(8)');assert.equal(await page.locator('.math-fraction').count(),1);
 await key('equals');assert.equal(await page.locator('#result').getAttribute('aria-label'),'7/8');await key('toggleExact');assert.equal(await page.locator('#result').innerText(),'0,875');
 await key('clear');for(const name of ['fraction','7','down','8','up','del','5','equals'])await key(name);assert.equal(await page.locator('#result').getAttribute('aria-label'),'5/8');
 await key('clear');for(const name of ['sqrt','2','4'])await key(name);assert.equal(await page.locator('.math-root').count(),1);await key('equals');assert.equal(await page.locator('#result').innerText(),'2√6');
 await key('clear');for(const name of ['2','power','3'])await key(name);assert.equal(await page.locator('.math-power sup').innerText(),'3');await key('equals');assert.equal(await page.locator('#result').innerText(),'8');
 console.log('Natural display and editor interactions passed');
} finally {await browser.close()}
