import test from 'node:test';
import assert from 'node:assert/strict';
import * as m from '../src/linear.js';
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<t, `${a} != ${b}`);
const vectorNear=(a,b)=>{assert.equal(a.length,b.length);a.forEach((x,i)=>near(x,b[i]));};
const matrixNear=(a,b)=>{assert.equal(a.length,b.length);a.forEach((r,i)=>vectorNear(r,b[i]));};
// Casio fx-991LA X Quick Start guide pp. 13–14: A=[[1,2],[-3,4]], B=[[3,-6],[8,2]].
test('official manual matrix example: addition, determinant, inverse',()=>{const a=[[1,2],[-3,4]],b=[[3,-6],[8,2]];matrixNear(m.matrixAdd(a,b),[[4,-4],[5,6]]);near(m.determinant(a),10);matrixNear(m.matrixMultiply(a,m.matrixInverse(a)),m.matrixIdentity(2));});
// Guide p. 17: u=(2,3,-2), v=(3,-4,5).
test('official manual vector inputs',()=>{const u=[2,3,-2],v=[3,-4,5];vectorNear(m.vectorSubtract(u,v),[-1,7,-7]);near(m.vectorDot(u,v),-16);vectorNear(m.vectorCross(u,v),[7,-16,-17]);near(m.vectorNorm(u),Math.sqrt(17));near(m.vectorNorm(m.vectorUnit(u)),1);});
test('systems and matrix dimensions',()=>{vectorNear(m.solveSystem([[2,1,-1],[-3,-1,2],[-2,1,2]],[8,-11,-3]),[2,3,-1]);matrixNear(m.matrixTranspose([[1,2,3],[4,5,6]]),[[1,4],[2,5],[3,6]]);assert.throws(()=>m.matrixInverse([[1,2],[2,4]]),/Singular/);assert.throws(()=>m.matrixMultiply([[1,2]],[[1,2]]),/Dimension/);assert.throws(()=>m.vectorUnit([0,0]),/Math/);});
test('quadratic cubic and quartic roots',()=>{const a=m.polynomialRoots([1,-3,2]).map(x=>x.re).sort();vectorNear(a,[1,2]);const b=m.polynomialRoots([1,0,1]);near(b[0].im,1);near(b[1].im,-1);const c=m.polynomialRoots([1,-6,11,-6]);vectorNear(c.map(x=>x.re),[1,2,3]);const d=m.polynomialRoots([1,0,-5,0,4]);vectorNear(d.map(x=>x.re),[-2,-1,1,2]);assert.throws(()=>m.polynomialRoots([0,1,1]),/Leading/);});
test('repeated roots do not fail or invent complex values',()=>{for(const [c,expected] of [[[1,-3,3,-1],[1,1,1]],[[1,-4,6,-4,1],[1,1,1,1]]]){const roots=m.polynomialRoots(c);vectorNear(roots.map(r=>r.re),expected);roots.forEach(r=>near(r.im,0));}});
