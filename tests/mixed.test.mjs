import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from '../src/engine.js';
import {exactResult} from '../src/exact.js';
test('mixed input evaluates exactly, including negative and nested arithmetic',()=>{assert.equal(exactResult('mix(2,3,11)'),'25/11');assert.equal(exactResult('-mix(2,3,11)'), '−25/11');assert.equal(exactResult('7/8+mix(2,3,11)'), '277/88');assert.ok(Math.abs(evaluate('mix(2,3,11)')-25/11)<1e-14)});
test('mixed number rejects invalid domains',()=>{for(const s of ['mix(2,3,0)','mix(-2,3,11)','mix(2,1.5,3)'])assert.throws(()=>evaluate(s),/Math ERROR/)});
