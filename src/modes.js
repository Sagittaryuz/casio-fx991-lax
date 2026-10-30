/** Independent numerical tools for selected fx-991LA X modes.
 * Floating-point results are approximations; see MODES.md. */
import {evaluate} from './engine.js';
const fail = () => { throw Error('Math ERROR'); };
const finite = n => { if (!Number.isFinite(n)) fail(); return Object.is(n, -0) ? 0 : n; };
const z = (re, im=0) => ({re:finite(Number(re)), im:finite(Number(im))});
const asComplex = v => typeof v === 'string' ? parseComplex(v) : typeof v === 'number' ? z(v) : z(v?.re,v?.im);

/** Parse rectangular a+bi, a-bi, pure bi/i or a real number. */
export function parseComplex(value) {
  const s=String(value).replace(/\s+/g,'').replaceAll('−','-').toLowerCase();
  if (!s) throw Error('Syntax ERROR');
  const num='(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?';
  const full=new RegExp(`^([+-]?${num})?([+-](?:${num})?)?i$`);
  const m=s.match(full);
  if(m) {
    if (m[1] && !m[2]) return z(0,Number(m[1]));
    const im=m[2] ? (m[2]==='+'?1:m[2]==='-'?-1:Number(m[2])) : 1;
    return z(m[1]?Number(m[1]):0, im);
  }
  if(s==='-i') return z(0,-1);
  if(new RegExp(`^[+-]?${num}$`).test(s)) return z(Number(s),0);
  throw Error('Syntax ERROR');
}
export function complexOperation(a, op, b) {
  const x=asComplex(a), y=asComplex(b);
  switch(op) {
    case '+': return z(x.re+y.re,x.im+y.im);
    case '-': return z(x.re-y.re,x.im-y.im);
    case '*': case '×': return z(x.re*y.re-x.im*y.im,x.re*y.im+x.im*y.re);
    case '/': case '÷': { const d=y.re*y.re+y.im*y.im; if(!d) fail(); return z((x.re*y.re+x.im*y.im)/d,(x.im*y.re-x.re*y.im)/d); }
    default: throw Error('Syntax ERROR');
  }
}
export function complexPolar(a, angle='DEG') {
  const c=asComplex(a); let theta=Math.atan2(c.im,c.re);
  if(angle==='DEG') theta*=180/Math.PI; else if(angle!=='RAD') throw Error('Syntax ERROR');
  return {radius:finite(Math.hypot(c.re,c.im)), angle:finite(theta)};
}
export function complexFromPolar(radius, theta, angle='DEG') {
  radius=Number(radius); theta=Number(theta); if(radius<0 || !Number.isFinite(radius) || !Number.isFinite(theta)) fail();
  if(angle==='DEG') theta*=Math.PI/180; else if(angle!=='RAD') throw Error('Syntax ERROR');
  return z(radius*Math.cos(theta),radius*Math.sin(theta));
}

const allowedBase = b => { b=Number(b); if(![2,8,10,16].includes(b)) throw Error('Syntax ERROR'); return b; };
const min=-2147483648n, max=2147483647n, mask=0xffffffffn;
function readBase(value, base) {
  base=allowedBase(base); const s=String(value).trim().toUpperCase();
  if(!s) throw Error('Syntax ERROR');
  const negative=s[0]==='-', digits=(negative||s[0]==='+')?s.slice(1):s;
  if(!digits) throw Error('Syntax ERROR'); let n=0n;
  for(const char of digits) {const d=parseInt(char,16); if(!/^[0-9A-F]$/.test(char)||d>=base) throw Error('Syntax ERROR'); n=n*BigInt(base)+BigInt(d); if(n>mask+1n) fail();}
  if(negative) n=-n;
  else if(base!==10 && n>max && n<=mask) n-=mask+1n;
  if(n<min||n>max) fail(); return n;
}
function writeBase(n, base) {
  base=allowedBase(base); if(n<min||n>max) fail();
  if(n<0n && base!==10) { const width={2:32,8:11,16:8}[base]; return (n&mask).toString(base).toUpperCase().padStart(width,'0'); }
  return n.toString(base).toUpperCase();
}
/** Signed 32-bit integer conversion (BIN/OCT/DEC/HEX). */
export function baseConvert(value, from, to) {return writeBase(readBase(value,from),to);}
export function baseOperation(a, op, b, base) {
  const x=readBase(a,base), y=readBase(b,base); let r;
  switch(op.toLowerCase()) {
    case '+': r=x+y; break; case '-': r=x-y; break; case '*': case '×': r=x*y; break;
    case '/': case '÷': if(y===0n) fail(); r=x/y; break;
    case 'and': r=x&y; break; case 'or': r=x|y; break; case 'xor': r=x^y; break; case 'xnor': r=~(x^y); break;
    default: throw Error('Syntax ERROR');
  }
  return writeBase(r,base);
}
export function baseNot(a,base) {return writeBase(~readBase(a,base),base);}

/** Evaluate up to two expressions containing X over a finite, bounded range. */
export function makeTable(f, g, start, end, step, options={}) {
  start=Number(start); end=Number(end); step=Number(step);
  if(![start,end,step].every(Number.isFinite)||step<=0||end<start) fail();
  const count=Math.floor((end-start)/step+1e-10)+1;
  if(count<1||count>1000) fail();
  const exprs=[f,g].filter(s=>s!==undefined&&s!==null&&String(s).trim()!=='');
  if(!exprs.length) throw Error('Syntax ERROR');
  return Array.from({length:count},(_,i)=>{
    const x=finite(start+i*step);
    const values=exprs.map(e=>{
      const expression=String(e).replace(/(?<![a-z])x(?![a-z])/gi,`(${x})`);
      try{return evaluate(expression,options);}catch{return null;}
    });
    return {x,values};
  });
}
/** Solve A:B = C:D for C (missing='C') or D (missing='D'). */
export function solveProportion(a,b,value,missing='C') {
  a=Number(a); b=Number(b); value=Number(value);
  if(![a,b,value].every(Number.isFinite)||b===0) fail();
  if(missing==='C') {if(value===0) fail(); return finite(a*value/b);}
  if(missing==='D') {if(a===0||value===0) fail(); return finite(b*value/a);}
  throw Error('Syntax ERROR');
}

const poly=(c,x)=>c.reduce((p,a)=>p*x+a,0);
function realRoots(coeffs) {
  const c=[...coeffs]; while(c.length>1&&c[0]===0)c.shift(); const degree=c.length-1;
  if(degree===0)return [];
  if(degree===1)return [-c[1]/c[0]];
  const bound=1+Math.max(...c.slice(1).map(a=>Math.abs(a/c[0])));
  if(!Number.isFinite(bound)) fail();
  const derivative=c.slice(0,-1).map((v,i)=>v*(degree-i));
  const critical=realRoots(derivative).filter(x=>x>-bound&&x<bound);
  const pts=[-bound,...critical,bound], roots=[];
  // Scale the residual to the local magnitude of the polynomial terms.
  const nearZero=x=>Math.abs(poly(c,x))<=1e-10*Math.max(1,c.reduce((s,v,i)=>s+Math.abs(v)*Math.abs(x)**(degree-i),0));
  for(const x of critical) if(nearZero(x)) roots.push(x);
  for(let i=0;i<pts.length-1;i++) {
    let l=pts[i], r=pts[i+1], fl=poly(c,l), fr=poly(c,r);
    if(!Number.isFinite(fl)||!Number.isFinite(fr))fail();
    if(nearZero(l)||nearZero(r)||Math.sign(fl)===Math.sign(fr))continue;
    for(let j=0;j<100;j++){const m=(l+r)/2, fm=poly(c,m); if(Math.sign(fm)===Math.sign(fl)){l=m;fl=fm;}else r=m;}
    roots.push((l+r)/2);
  }
  roots.sort((a,b)=>a-b);
  return roots.filter((x,i)=>i===0||Math.abs(x-roots[i-1])>1e-8*Math.max(1,Math.abs(x)));
}
/** Numeric solution of real polynomial inequalities, degree <= 4.
 * Array of {lower,upper,lowerInclusive,upperInclusive}; null endpoints denote infinity. */
export function solveInequality(coefficients,relation) {
  if(!Array.isArray(coefficients)) throw Error('Syntax ERROR');
  const c=coefficients.map(Number); if(c.length<2||c.length>5||!c.every(Number.isFinite)) fail();
  if(!['<','<=','>','>='].includes(relation)) throw Error('Syntax ERROR');
  if(c.every(v=>v===0)) return relation.includes('=') ? [{lower:null,upper:null,lowerInclusive:false,upperInclusive:false}] : [];
  const roots=realRoots(c), inclusive=relation.includes('='), positive=relation[0]==='>';
  const boundaries=[null,...roots,null], spans=[];
  for(let i=0;i<boundaries.length-1;i++) {
    const lo=boundaries[i], hi=boundaries[i+1];
    const probe=lo===null?(hi===null?0:hi-Math.max(1,Math.abs(hi))):hi===null?lo+Math.max(1,Math.abs(lo)):(lo+hi)/2;
    const v=poly(c,probe); if((positive&&v>0)||(!positive&&v<0)) spans.push({lower:lo,upper:hi,lowerInclusive:lo!==null&&inclusive,upperInclusive:hi!==null&&inclusive});
  }
  if(inclusive) for(const root of roots) if(!spans.some(v=>v.lower===root||v.upper===root)) spans.push({lower:root,upper:root,lowerInclusive:true,upperInclusive:true});
  spans.sort((a,b)=>(a.lower??-Infinity)-(b.lower??-Infinity));
  const merged=[];
  for(const span of spans){const prev=merged.at(-1);if(prev&&prev.upper!==null&&prev.upper===span.lower&&prev.upperInclusive&&span.lowerInclusive){prev.upper=span.upper;prev.upperInclusive=span.upperInclusive;} else merged.push(span);}
  return spans.length?merged:[];
}
