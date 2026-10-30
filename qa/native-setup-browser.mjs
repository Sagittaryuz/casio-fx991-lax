import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{const p=await browser.newPage({viewport:{width:393,height:852}});await p.goto(process.env.CALC_URL||'http://127.0.0.1:4173/',{waitUntil:'networkidle'});await p.evaluate(async()=>{const {mountNativeSetup}=await import('/src/native-setup.js');const {createSettings}=await import('/src/settings.js');const host=document.createElement('div');host.style.cssText='position:fixed;z-index:100;left:0;top:0;width:340px;height:130px';document.body.append(host);const entries=new Map();const storage={getItem:k=>entries.has(k)?entries.get(k):null,setItem:(k,v)=>entries.set(k,v)};window.store=createSettings(storage);window.events=[];window.create=()=>mountNativeSetup(host,store,{onApply:(value,warning)=>events.push(['apply',value,warning]),onCancel:()=>events.push(['cancel']),onResetAll:()=>events.push(['reset-all'])});window.ui=create()});
 const call=async(...actions)=>p.evaluate(a=>a.forEach(x=>ui.press(x)),actions);
 await call('2','3');assert.equal(await p.evaluate(()=>store.get().angle),'GRAD');assert.equal(await p.evaluate(()=>events.at(-1)[0]),'apply');
 await p.evaluate(()=>{ui.destroy();ui=create()});await call('3','1','2');assert.deepEqual(await p.evaluate(()=>store.get()),{angle:'GRAD',format:'FIX',digits:2});
 await p.evaluate(()=>{ui.destroy();ui=create()});await call('3','1','left','left','clear');assert.equal(await p.evaluate(()=>events.at(-1)[0]),'cancel');assert.deepEqual(await p.evaluate(()=>store.get()),{angle:'GRAD',format:'FIX',digits:2});
 await p.evaluate(()=>{ui.destroy();ui=create()});await call('9','2','2');assert.equal(await p.evaluate(()=>events.some(v=>v[0]==='reset-all')),false);await call('2','1');assert.equal(await p.evaluate(()=>events.some(v=>v[0]==='reset-all')),true);assert.deepEqual(await p.evaluate(()=>store.get()),{angle:'DEG',format:'NORM',digits:1});
 console.log('Native SETUP: numbered selection, persistence, back/cancel and confirmed reset passed');
}finally{await browser.close()}
