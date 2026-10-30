import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from '../src/engine.js';
import {complexPolar,complexFromPolar} from '../src/modes.js';
import {vectorAngle} from '../src/linear.js';
import {derivative,integral} from '../src/calculus.js';
const near=(a,b,tol=1e-10)=>assert.ok(Math.abs(a-b)<tol,`${a} != ${b}`);
test('GRAD trigonometry and inverse trigonometry',()=>{
 near(evaluate('sin(100)',{angle:'GRAD'}),1);near(evaluate('cos(200)',{angle:'GRAD'}),-1);
 near(evaluate('asin(1)',{angle:'GRAD'}),100);near(evaluate('atan(1)',{angle:'GRAD'}),50);
 assert.throws(()=>evaluate('tan(100)',{angle:'GRAD'}),/Math ERROR/);
 assert.throws(()=>evaluate('sin(1)',{angle:'BAD'}),/Syntax ERROR/);
});
test('GRAD applies in calculus, complex and vector modes',()=>{
 near(derivative('sin(x)',0,{angle:'GRAD'}),Math.PI/200,1e-8);
 near(integral('sin(x)',0,200,{angle:'GRAD'}),400/Math.PI,1e-8);
 near(complexPolar('1+i','GRAD').angle,50);const z=complexFromPolar(1,100,'GRAD');near(z.re,0);near(z.im,1);
 near(vectorAngle([1,0],[0,1],'GRAD'),100);
});
test('adjacent variables represent multiplication, without changing names of functions',()=>{
 near(evaluate('x^2+Ax+Bx',{variables:{A:5,B:6,x:2}}),26);
 near(evaluate('ABx',{variables:{A:2,B:3,x:4}}),24);
 near(evaluate('sin(30)+Ans',{ans:4}),4.5);
 assert.throws(()=>evaluate('foo(2)'),/Syntax ERROR/);
});
test('indexed root and arbitrary-base logarithm enforce real domains',()=>{
 near(evaluate('nthroot(3,-8)'),-2);near(evaluate('nthroot(-3,-8)'),-.5);near(evaluate('nthroot(2,9)'),3);near(evaluate('logbase(2,8)'),3);
 for(const e of ['nthroot(2,-4)','nthroot(0,3)','nthroot(-2,0)','logbase(0,2)','logbase(1,3)','logbase(2,-1)'])assert.throws(()=>evaluate(e),/Math ERROR/);
});
