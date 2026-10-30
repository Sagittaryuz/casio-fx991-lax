import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluate, formatResult } from '../src/engine.js';
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-10, `${a} != ${b}`);
test('precedence, powers and implicit multiplication', () => {
  near(evaluate('2+3×4'),14); near(evaluate('2(3+4)'),14);
  near(evaluate('-2^2'),-4); near(evaluate('2^-2'),.25); near(evaluate('2^3^2'),512);
});
test('angles, logs, factorial and memory', () => {
  near(evaluate('sin(30)'),.5); near(evaluate('cos(π)',{angle:'RAD'}),-1);
  near(evaluate('asin(1)'),90); near(evaluate('log(1000)+ln(e)'),4);
  near(evaluate('sqrt(9)+5!'),123); near(evaluate('Ans*2+M',{ans:3,memory:4}),10);
  near(evaluate('25%'),.25);
});
test('domain, syntax and display', () => {
  for(const e of ['1/0','sqrt(-1)','asin(2)','tan(90)','log(0)','(-1)^0.5','1+','foo(2)']) assert.throws(()=>evaluate(e),/ERROR/);
  assert.equal(formatResult(1/3),'0.3333333333'); assert.equal(formatResult(-0),'0');
});
test('official fx-991LA X quick-start conversion example, page 29', () => {
  // 40 fl oz × 29.5735 mL/fl oz; guide displays the result rounded to 1182.9 mL.
  near(evaluate('40*29.5735'), 1182.94);
  assert.equal(evaluate('40*29.5735').toFixed(1), '1182.9');
});
test('combinatorics, arbitrary-base logarithm and inverse hyperbolic functions', () => {
  near(evaluate('npr(5,2)'),20); near(evaluate('ncr(10,3)'),120);
  near(evaluate('logbase(2,8)'),3); near(evaluate('asinh(sinh(2))'),2);
  near(evaluate('acosh(cosh(2))'),2); near(evaluate('atanh(tanh(0.4))'),0.4);
  for(const e of ['ncr(2,3)','npr(-1,0)','ncr(2.5,1)','logbase(1,2)','ncr(2)','sin(1,2)']) assert.throws(()=>evaluate(e),/ERROR/);
});
