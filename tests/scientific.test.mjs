import {test} from 'node:test';
import assert from 'node:assert/strict';
import {toDMS,fromDMS,primeFactors,engineering,polar,rectangular,roundToDisplay,logBase,nthRoot} from '../src/scientific.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('sexagesimal conversion, carry, sign and limits',()=>{
 assert.deepEqual(toDMS(12.5),{negative:false,degrees:12,minutes:30,seconds:0});
 assert.deepEqual(toDMS(-2.5),{negative:true,degrees:2,minutes:30,seconds:0});
 near(fromDMS(12,34,56),12+34/60+56/3600);near(fromDMS(2,30,0,true),-2.5);
 assert.throws(()=>fromDMS(1,60,0),/Math ERROR/);assert.throws(()=>toDMS(Infinity),/Math ERROR/);
});
test('prime factorization and bounded input',()=>{
 assert.deepEqual(primeFactors(756),[{prime:2,exponent:2},{prime:3,exponent:3},{prime:7,exponent:1}]);
 assert.deepEqual(primeFactors(97),[{prime:97,exponent:1}]);
 for(const n of [0,1,-3,2.1,1e10])assert.throws(()=>primeFactors(n),/Math ERROR/);
});
test('engineering shifts, including small values',()=>{
 assert.deepEqual(engineering(12345),{mantissa:12.345,exponent:3});
 assert.deepEqual(engineering(.00123),{mantissa:1.23,exponent:-3});
 assert.deepEqual(engineering(12345,1),{mantissa:.012345,exponent:6});
 assert.throws(()=>engineering(Infinity),/Math ERROR/);
});
test('polar and rectangular angles across modes',()=>{
 const p=polar(3,4);near(p.radius,5);near(p.angle,53.13010235415598);
 const r=rectangular(p.radius,p.angle);near(r.x,3);near(r.y,4);
 near(polar(0,1,'GRAD').angle,100);near(rectangular(1,Math.PI/2,'RAD').y,1);
 assert.throws(()=>rectangular(-1,0),/Math ERROR/);assert.throws(()=>polar(1,1,'OTHER'),/Math ERROR/);
});
test('round, logarithm and real indexed roots (official quick-start p.4)',()=>{
 near(roundToDisplay(1.23456,'FIX',2),1.23);near(roundToDisplay(1234.56,'SCI',3),1230);
 near(logBase(.5,16),-4);near(nthRoot(5,64),Math.pow(64,.2));near(nthRoot(3,-8),-2);near(nthRoot(-3,-8),-.5);
 for(const f of [()=>logBase(1,2),()=>logBase(2,0),()=>nthRoot(2,-4),()=>nthRoot(0,4),()=>nthRoot(-2,0),()=>roundToDisplay(1,'FIX',10)])assert.throws(f,/Math ERROR/);
});
