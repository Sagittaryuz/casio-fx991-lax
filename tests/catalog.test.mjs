import {test} from 'node:test';
import assert from 'node:assert/strict';
import {CONSTANTS,CONVERSIONS,getConstant,convert} from '../src/catalog.js';
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)),`${a} != ${b}`);
test('LA X manual lists 47 unique CODATA-2010 constants',()=>{
 assert.equal(CONSTANTS.length,47);assert.equal(new Set(CONSTANTS.map(c=>c.id)).size,47);
 assert.equal(getConstant('c0').value,299792458);assert.equal(getConstant('h').value,6.62606957e-34);assert.equal(getConstant('Vm').value,22.710953e-3);assert.equal(getConstant('t').value,273.15);
 assert.throws(()=>getConstant('not-in-catalog'));
});
test('LA X guide: 500 in = 1270 cm, 5 cm = 1.968503937 in',()=>{
 near(convert('in-cm-forward',500),1270);near(convert('in-cm-reverse',5),1.968503937007874);
});
test('NIST 811 cited factors and affine temperatures',()=>{
 near(convert('gal-us-l-forward',1),3.785411784);near(convert('gal-uk-l-forward',1),4.54609);near(convert('f-c-forward',32),0);near(convert('f-c-forward',212),100);near(convert('f-c-reverse',100),212);
 near(convert('j-cal15-reverse',1),4.1858);near(convert('mmhg-pa-forward',1),133.3224);near(convert('pc-km-forward',1),3.085678e13);near(convert('acre-m2-forward',1),4046.873);
});
test('all 40 conversions round trip, reject missing id and non-finite values',()=>{
 assert.equal(CONVERSIONS.length,40);assert.equal(new Set(CONVERSIONS.map(c=>c.id)).size,40);
 for(const c of CONVERSIONS.filter(x=>x.id.endsWith('-forward'))){const reverse=c.id.replace(/-forward$/,'-reverse');near(convert(reverse,convert(c.id,123.456)),123.456)}
 assert.throws(()=>convert('missing',1));assert.throws(()=>convert('in-cm-forward',Infinity));
});
