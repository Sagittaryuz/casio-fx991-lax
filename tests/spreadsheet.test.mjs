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
