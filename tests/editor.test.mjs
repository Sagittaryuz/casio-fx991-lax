import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CalculatorEditor} from '../src/editor.js';
import {evaluate} from '../src/engine.js';

test('editing, cursor, shift and alpha state',()=>{
 const e=new CalculatorEditor();e.insert('123');e.move(-1);e.insert('+');assert.equal(e.expression,'12+3');e.backspace();assert.equal(e.expression,'123');e.move(-99);e.backspace();assert.equal(e.expression,'123');e.setModifier('shift');assert.equal(e.consumeModifier(),'shift');assert.equal(e.consumeModifier(),null);e.setModifier('alpha');e.setModifier('alpha');assert.equal(e.modifier,null);e.clear();assert.equal(e.cursor,0);
});
test('variables survive snapshot and do not collide with mathematical e',()=>{
 const e=new CalculatorEditor();e.store('A',3);e.store('E',5);e.store('M',7);e.ans=2;const f=new CalculatorEditor(e.snapshot());assert.equal(f.recall('E'),5);assert.equal(evaluate('A*2+E+M',{variables:f.variables}),18);assert.equal(evaluate('e',{variables:f.variables}),Math.E);assert.throws(()=>f.store('Z',1));
});
