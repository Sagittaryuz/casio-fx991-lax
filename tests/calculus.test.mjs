import { test } from 'node:test';
import assert from 'node:assert/strict';
import { derivative, integral, summation } from '../src/calculus.js';
const near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('official fx-991LA X quick-start guide page 5',()=>{
  near(summation('x^2+1',-3,7),165);
  near(derivative('4*x^2-5*x',0.2),-17/5);
  near(integral('1/x',2,5),0.9162907319,1e-9);
});
test('integration, angular units and accumulation',()=>{
  near(integral('x^2',0,3),9); near(integral('x',3,0),-4.5);
  near(integral('sin(x)',0,Math.PI,{angle:'RAD'}),2);
  near(derivative('sin(x)',0,{angle:'RAD'}),1);
  near(summation('x',1,100),5050);
});
test('reject invalid domains and bounded work',()=>{
  for(const f of [()=>integral('1/x',-1,1),()=>integral('sqrt(x)',-1,1),()=>derivative('sqrt(x)',-1),()=>summation('x',1,100001),()=>summation('x',2,1)]) assert.throws(f,/ERROR/);
});
