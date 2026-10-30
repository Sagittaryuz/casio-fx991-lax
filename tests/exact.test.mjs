import {test} from 'node:test';
import assert from 'node:assert/strict';
import {exactResult} from '../src/exact.js';

test('exact fractions and arithmetic',()=>{
 assert.equal(exactResult('7/8+2+3/11'),'277/88');
 assert.equal(exactResult('1/3+1/6'),'1/2');
 assert.equal(exactResult('(1/3)/(2/5)'),'5/6');
 assert.equal(exactResult('-2^2'), '−4');
 assert.equal(exactResult('2^-2'), '1/4');
 assert.equal(exactResult('2(1/3)'), '2/3');
});
test('official fx-991LA X guide pages 3–4: simplify and combine radicals',()=>{
 assert.equal(exactResult('sqrt(24)'), '2√6');
 assert.equal(exactResult('sqrt(24)+sqrt(150)'), '7√6');
 assert.equal(exactResult('sqrt(24)-sqrt(98)'), '−7√2 + 2√6');
 assert.equal(exactResult('sqrt(8)/sqrt(2)'), '2');
 assert.equal(exactResult('sqrt(1/2)'), '√2/2');
 assert.equal(exactResult('(sqrt(2)+1)^2'), '3 + 2√2');
});
test('unsupported and domain cases fall back to numerical evaluator',()=>{
 for(const e of ['sin(30)','pi','sqrt(-1)','1/0','1/(1+sqrt(2))','2^0.5','Ans','1+']) assert.equal(exactResult(e),null,e);
});
