import { test } from 'node:test';
import assert from 'node:assert/strict';
import {createSettings, formatNumber, SETTINGS_KEY} from '../src/settings.js';

function storage(){const map=new Map();return {getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v),raw:map}}
test('settings persist and reset without touching sheet storage',()=>{
 const s=storage();s.setItem('fx991lax.sheet.v1','sheet');const first=createSettings(s);
 first.set({angle:'GRAD',format:'FIX',digits:3});assert.deepEqual(createSettings(s).get(),{angle:'GRAD',format:'FIX',digits:3});
 first.reset();assert.deepEqual(createSettings(s).get(),{angle:'DEG',format:'NORM',digits:1});assert.equal(s.getItem('fx991lax.sheet.v1'),'sheet');
});
test('bad data and unavailable storage retain safe settings with visible warning',()=>{
 const s=storage();s.setItem(SETTINGS_KEY,'broken');const first=createSettings(s);assert.match(first.getWarning(),/ler/);assert.equal(s.getItem(SETTINGS_KEY),'broken');
 const denied={getItem(){throw Error('denied')},setItem(){throw Error('denied')}};const second=createSettings(denied);const result=second.set({angle:'RAD',format:'SCI',digits:5});assert.match(result.warning,/salvar/);assert.equal(second.get().angle,'RAD');
 assert.throws(()=>second.set({angle:'RAD',format:'FIX',digits:12}),/inválida/);
});
test('FIX, SCI and NORM display settings',()=>{
 const spec=(format,digits)=>({angle:'DEG',format,digits});
 assert.equal(formatNumber(12.345,spec('FIX',2)),'12.35');assert.equal(formatNumber(2,spec('FIX',3)),'2.000');
 assert.equal(formatNumber(1234,spec('SCI',3)),'1.23×10^3');assert.equal(formatNumber(0.0012,spec('SCI',2)),'1.2×10^-3');
 assert.equal(formatNumber(.001,spec('NORM',1)),'1×10^-3');assert.equal(formatNumber(.001,spec('NORM',2)),'0.001');
 assert.throws(()=>formatNumber(Infinity,spec('FIX',2)),/Math ERROR/);
});
