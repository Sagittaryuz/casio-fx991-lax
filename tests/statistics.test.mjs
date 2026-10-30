import {test} from 'node:test';
import assert from 'node:assert/strict';
import {oneVariable,twoVariable,regression,normalPDF,normalCDF,normalInterval,inverseNormal,binomialPDF,binomialCDF,poissonPDF,poissonCDF} from '../src/statistics.js';
const near=(actual,expected,tol=1e-10)=>assert.ok(Math.abs(actual-expected)<=tol,`${actual} != ${expected}`);
// Casio fx-991LA X Quick Start Guide, pp. 20 and 24: height list and paired values.
test('official height list and paired regression examples',()=>{
 const s=oneVariable([70.5,74,67,71,71,72,73.5,72,69,71]);near(s.mean,71.1);assert.equal(s.n,10);assert.equal(s.min,67);assert.equal(s.max,74);
 const points=[[1,1],[2,4],[3,9],[4,16]];const a=twoVariable(points);near(a.sumX,10);near(a.sumY,30);near(a.sumXY,100);
 const r=regression(points);near(r.a,-5);near(r.b,5);near(r.predict(5),20);
 const q=regression(points,'quadratic');near(q.a,0);near(q.b,0);near(q.c,1);near(q.predict(5),25);
});
test('frequency, quartiles, sample variance and model domains',()=>{
 const a=oneVariable([[1,2],[3,1],[5,2]]);near(a.mean,3);near(a.populationSD,Math.sqrt(3.2));near(a.sampleSD,2);near(a.q1,1);near(a.median,3);near(a.q3,5);
 const r=regression([[1,2],[2,8],[3,18]],'power');near(r.a,2);near(r.b,2);near(r.predict(4),32);
 assert.throws(()=>oneVariable([[1,-1]]));assert.throws(()=>regression([[0,1],[1,2]],'logarithmic'));
});
// Guide pp. 25–27, six rolls: P(X<=1) and 90th percentile with mean 70, SD 4.
test('official binomial and inverse normal examples',()=>{
 near(binomialCDF(1,6,1/6),0.736775548696845,1e-12);near(1-binomialCDF(1,6,1/6),0.263224451303155,1e-12);
 near(inverseNormal(.9,70,4),75.126206262,1e-7);near(binomialPDF(0,6,1/6),(5/6)**6);near(binomialCDF(-1,6,.5),0);near(binomialPDF(0,5,0),1);
});
test('normal and Poisson known values, endpoints and invalid inputs',()=>{
 near(normalPDF(0),1/Math.sqrt(2*Math.PI));near(normalCDF(0),.5);near(normalInterval(-1,1),.682689492,2e-7);near(inverseNormal(.975),1.959963985,1e-8);
 near(poissonPDF(2,3),Math.exp(-3)*4.5);near(poissonCDF(2,3),Math.exp(-3)*8.5);near(poissonPDF(0,0),1);assert.throws(()=>normalPDF(1,0,0));assert.throws(()=>binomialCDF(1,3,1.1));assert.throws(()=>poissonPDF(1,-1));
});
