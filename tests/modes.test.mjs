import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseComplex,complexOperation,complexPolar,complexFromPolar,baseConvert,baseOperation,baseNot,makeTable,solveProportion,solveInequality} from '../src/modes.js';
const close=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} ≠ ${b}`);

test('complex arithmetic and polar, Casio guide p.11–12',()=>{
 assert.deepEqual(complexOperation('2+3i','+','5-7i'),{re:7,im:-4});
 assert.deepEqual(complexOperation('3-2i','*','5+6i'),{re:27,im:8});
 close(complexPolar('1+2i').angle,63.43494882292201);
 const p=complexFromPolar(2,330); close(p.re,Math.sqrt(3)); close(p.im,-1);
 assert.deepEqual(parseComplex('-i'),{re:0,im:-1});
 assert.deepEqual(parseComplex('-2.5e-3+1e+2i'),{re:-0.0025,im:100});
 assert.throws(()=>complexOperation('1','/','0'),/Math ERROR/);
 assert.throws(()=>parseComplex('1+i+2'),/Syntax ERROR/);
});
test('32-bit base conversion, arithmetic and logic',()=>{
 assert.equal(baseConvert('255',10,16),'FF'); assert.equal(baseConvert('FFFFFFFF',16,10),'-1');
 assert.equal(baseConvert('-1',10,16),'FFFFFFFF'); assert.equal(baseConvert('-1',10,2),'1'.repeat(32));
 assert.equal(baseOperation('F0','and','0F',16),'0'); assert.equal(baseOperation('101','+', '11',2),'1000');
 assert.equal(baseNot('0',16),'FFFFFFFF'); assert.throws(()=>baseConvert('2',2,10),/Syntax ERROR/);
 assert.throws(()=>baseOperation('2147483647','+','1',10),/Math ERROR/);
});
test('table includes Casio guide p.36 example and two functions',()=>{
 const rows=makeTable('x(20-x)(15-x)','x^2-3x+2',1,7,1);
 assert.equal(rows.length,7); assert.deepEqual(rows[0],{x:1,values:[266,0]});
 assert.deepEqual(rows[4],{x:5,values:[750,12]});
 assert.equal(makeTable('1/x',null,-1,1,1)[1].values[0],null);
 assert.throws(()=>makeTable('x',null,0,1001,1),/Math ERROR/);
});
test('proportion and invalid denominator',()=>{
 assert.equal(solveProportion(2,3,12,'C'),8); assert.equal(solveProportion(2,3,8,'D'),12);
 assert.equal(solveProportion(0,3,12,'C'),0); assert.throws(()=>solveProportion(0,3,0,'D'),/Math ERROR/);
});
test('polynomial inequalities, including repeated roots and guide p.45 cubic',()=>{
 const cubic=solveInequality([1,4,1,-6],'<');
 assert.equal(cubic.length,2); close(cubic[0].upper,-3); close(cubic[1].lower,-2); close(cubic[1].upper,1);
 assert.equal(cubic[0].lower,null); assert.equal(cubic[1].lowerInclusive,false);
 const repeated=solveInequality([1,-2,1],'<='); assert.equal(repeated.length,1); close(repeated[0].lower,1); close(repeated[0].upper,1);
 const all=solveInequality([1,-2,1],'>='); assert.equal(all.length,1); assert.equal(all[0].lower,null); assert.equal(all[0].upper,null);
 assert.deepEqual(solveInequality([1,0,1],'<'),[]);
 assert.equal(solveInequality([0,0],'>=').length,1);
 assert.deepEqual(solveInequality([0,0],'>'),[]);
});
