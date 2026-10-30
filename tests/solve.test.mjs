import {test} from 'node:test';
import assert from 'node:assert/strict';
import {calculate,expressionVariables,solve} from '../src/solve.js';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} != ${b}`);
test('CALC substitution detects variables and preserves e/Ans/functions',()=>{
 assert.deepEqual(expressionVariables('sin(x)+A*e+E+Ans+1e-3'),['x','A','E']);
 near(calculate('Ax+B',{A:5,B:6,x:2}),16);
 assert.deepEqual(expressionVariables('ABx+sin(x)'),['A','B','x']);
 near(calculate('A*x+B=16',{A:5,B:6,x:2}),0);
 assert.throws(()=>calculate('A+B',{A:1}),/Variable ERROR/);
 assert.throws(()=>calculate('sqrt(-1)',{}),/Math ERROR/);
});
test('official LA X guide page 5 SOLVE: x² + Ax + B = 0',()=>{
 const x=solve('x^2+Ax+B=0','x',-5,{A:5,B:6}); near(x.root,-3); near(x.residual,0);
 const a=solve('x^2+A*x+B=0','A',2,{x:1,B:4}); near(a.root,-5); near(a.residual,0);
});
test('Newton finds local roots and rejects nonconvergence and malformed input',()=>{
 near(solve('x^2=2','x',1,{}).root,Math.SQRT2);
 assert.throws(()=>solve('x^2+1=0','x',0,{}),/Cannot Solve/);
 assert.throws(()=>solve('1/x=0','x',1,{}),/Cannot Solve/);
 assert.throws(()=>solve('sqrt(x)=2','x',-1,{}),/Math ERROR/);
 assert.throws(()=>solve('x+1=0','A',0,{}),/Variable ERROR/);
 assert.throws(()=>solve('x==1','x',1,{}),/Syntax ERROR/);
});
