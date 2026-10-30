import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Spreadsheet} from '../src/spreadsheet.js';

test('spreadsheet reference, arithmetic, range sum and mean',()=>{
 const s=new Spreadsheet(); [40,50,60].forEach((x,i)=>s.set('A'+(i+1),x));
 s.set('B1','=A1*29.5735'); assert.ok(Math.abs(s.value('B1')-1182.94)<1e-8);
 s.set('C1','=SUM(A1:A3)'); s.set('C2','=MEAN(A1:A3)');
 assert.equal(s.value('C1'),150); assert.equal(s.value('C2'),50);
 s.set('A2',80); assert.equal(s.value('C1'),180); assert.equal(s.value('C2'),60);
});
test('copy, fill, relative and absolute references; move',()=>{
 const s=new Spreadsheet(); s.set('A1',2); s.set('A2',3); s.set('B1','=A1+$A$1');
 s.copy('B1','B2'); assert.equal(s.get('B2'),'=A2+$A$1'); assert.equal(s.value('B2'),5);
 s.set('B1','=A1*2');s.fill('B1','B2');assert.equal(s.value('B2'),6);
 s.move('B2','C2');assert.equal(s.get('B2'),'');assert.equal(s.value('C2'),6);
});
test('rejects cycles, invalid addresses and copy outside bounds',()=>{
 const s=new Spreadsheet();s.set('A1','=B1');s.set('B1','=A1');assert.throws(()=>s.value('A1'),/Circular/);
 assert.throws(()=>s.set('F1',1),/Invalid/);s.set('B2','=A1');assert.throws(()=>s.copy('B2','A1'),/Invalid/);
});

test('snapshot persists formulas and restores independent state', async()=>{
 const {loadSpreadsheet,saveSpreadsheet,SPREADSHEET_STORAGE_KEY}=await import('../src/spreadsheet.js');
 const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
 const s=new Spreadsheet();s.set('A1','40');s.set('B1','=A1*29.5735');
 assert.equal(saveSpreadsheet(storage,s),true);
 const restored=loadSpreadsheet(storage);assert.equal(restored.error,null);assert.equal(restored.sheet.get('B1'),'=A1*29.5735');assert.ok(Math.abs(restored.sheet.value('B1')-1182.94)<1e-8);
 restored.sheet.set('A1',5);assert.equal(s.get('A1'),'40');assert.ok(store.has(SPREADSHEET_STORAGE_KEY));
});
test('corruption and unavailable storage never silently overwrite previous contents', async()=>{
 const {loadSpreadsheet,saveSpreadsheet}=await import('../src/spreadsheet.js');
 const corrupt='{broken';let writes=0;const storage={getItem:()=>corrupt,setItem:()=>{writes++}};
 const loaded=loadSpreadsheet(storage);assert.equal(loaded.blocked,true);assert.match(loaded.error,/preservados/);assert.equal(writes,0);
 const bad={getItem:()=>{throw Error('denied')},setItem:()=>{throw Error('quota')}};
 assert.equal(loadSpreadsheet(bad).blocked,true);assert.equal(saveSpreadsheet(bad,new Spreadsheet()),false);
 for(const snapshot of [{version:1,cells:{F1:'1'}},{version:2,cells:{}},{version:1,cells:{A1:3}},{version:1,cells:[]}])assert.throws(()=>Spreadsheet.fromSnapshot(snapshot));
});
