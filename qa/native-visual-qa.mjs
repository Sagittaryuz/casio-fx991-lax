import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {mkdir} from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const out=process.env.QA_OUTPUT||'/tmp/casio-native-visual-qa';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
const cases=[['complexos',['menu','2']],['base-n',['menu','3']],['matriz',['menu','4']],['vetor',['menu','5']],['estatistica',['menu','6']],['distribuicao',['menu','7']],['planilha',['menu','8']],['tabela',['menu','9']],['equacao',['menu','alpha','negative']],['desigualdade',['menu','alpha','dms']],['proporcao',['menu','alpha','inverse']],['setup',['shift','menu']]];
try{for(const [device,width,height,touch] of [['mobile',393,852,true],['desktop',1200,900,false]])for(const [name,actions] of cases){if(process.env.QA_DEVICE&&process.env.QA_DEVICE!==device)continue;if(process.env.QA_ONLY&&!process.env.QA_ONLY.split(',').includes(name))continue;
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:2,hasTouch:touch});const errors=[];page.on('pageerror',e=>errors.push(`pageerror: ${e.message}`));page.on('console',m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`)});
 await page.goto(process.env.CALC_URL||'http://127.0.0.1:4203/',{waitUntil:'networkidle'});for(const action of actions)await page.locator(`[data-action="${action}"]`).first().click();const host=page.locator('.native-mode-host');await host.waitFor({state:'visible'});const bbox=await host.boundingBox();assert.ok(bbox&&bbox.width>0&&bbox.height>0,`${device} ${name}: empty display`);
 const violations=await page.locator('button[data-action]').evaluateAll(buttons=>{const panel=document.querySelector('.native-mode-host').getBoundingClientRect();return buttons.map(b=>{const r=b.getBoundingClientRect();return {action:b.dataset.action,r:{x:r.x,y:r.y,right:r.right,bottom:r.bottom}}}).filter(({r})=>r.x<0||r.y<0||r.right>innerWidth+.5||r.bottom>innerHeight+.5||(r.x<panel.right&&r.right>panel.left&&r.y<panel.bottom&&r.bottom>panel.top))});assert.deepEqual(violations,[],`${device} ${name}: keys outside viewport or covered`);assert.deepEqual(errors,[],`${device} ${name}: browser errors`);
 await page.screenshot({path:`${out}/${name}-${device}.png`,animations:'disabled',timeout:15000});console.log(`${device} ${name}: ok`);await page.close();
}}finally{await browser.close()}
