(function(){const modules={"scientific.js":(exports,require)=>{
/** Scientific helpers, independent of the UI and proprietary firmware. */
const fail=()=>{throw Error('Math ERROR')};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const checked=n=>{if(!finite(n))fail();return Object.is(n,-0)?0:n};
function angleFactor(unit){if(unit==='DEG')return Math.PI/180;if(unit==='RAD')return 1;if(unit==='GRAD')return Math.PI/200;fail()}

/** Convert decimal degrees to signed DMS. Seconds retain up to 9 decimal places. */
function toDMS(value){
 if(!finite(value))fail();const negative=value<0||Object.is(value,-0);let absolute=Math.abs(value);
 let degrees=Math.floor(absolute);let rem=(absolute-degrees)*60;let minutes=Math.floor(rem);let seconds=Number(((rem-minutes)*60).toFixed(9));
 if(seconds>=60){seconds=0;minutes++}if(minutes>=60){minutes=0;degrees++}
 return {negative,degrees,minutes,seconds};
}
/** DMS accepts nonnegative components and an explicit sign. */
function fromDMS(degrees,minutes=0,seconds=0,negative=false){
 if(![degrees,minutes,seconds].every(finite)||degrees<0||minutes<0||seconds<0||minutes>=60||seconds>=60||!Number.isInteger(degrees)||!Number.isInteger(minutes)||typeof negative!=='boolean')fail();
 return checked((negative?-1:1)*(degrees+minutes/60+seconds/3600));
}
/** Prime factorization of integers in the implemented 10-digit range. */
function primeFactors(value){
 if(!Number.isSafeInteger(value)||value<2||value>9999999999)fail();let n=value;const factors=[];
 for(let p=2;p*p<=n;p=p===2?3:p+2){if(n%p)continue;let exponent=0;while(n%p===0){n/=p;exponent++}factors.push({prime:p,exponent})}
 if(n>1)factors.push({prime:n,exponent:1});return factors;
}
/** Engineering notation; shift moves exponent by 3 per step. */
function engineering(value,shift=0){
 if(!finite(value)||!Number.isSafeInteger(shift)||Math.abs(shift)>100)fail();if(value===0)return {mantissa:0,exponent:shift*3};
 let exponent=Math.floor(Math.log10(Math.abs(value))/3)*3+shift*3;
 if(exponent>306||exponent<-321)fail();let mantissa=checked(value/10**exponent);
 return {mantissa:Number(mantissa.toPrecision(10)),exponent};
}
/** Polar/rectangular conversions obey the selected angular unit. */
function polar(x,y,unit='DEG'){
 if(!finite(x)||!finite(y))fail();const factor=angleFactor(unit);return {radius:checked(Math.hypot(x,y)),angle:checked(Math.atan2(y,x)/factor)};
}
function rectangular(radius,angle,unit='DEG'){
 if(!finite(radius)||!finite(angle)||radius<0)fail();const r=angle*angleFactor(unit);return {x:checked(radius*Math.cos(r)),y:checked(radius*Math.sin(r))};
}
/** Explicit rounding to selected display format; result remains a number. */
function roundToDisplay(value,format='NORM',digits=10){
 if(!finite(value)||!Number.isInteger(digits))fail();
 if(format==='FIX'){if(digits<0||digits>9)fail();const rounded=Number(value.toFixed(digits));return checked(rounded)}
 if(format==='SCI'||format==='NORM'){if(digits<1||digits>10)fail();return checked(Number(value.toPrecision(digits)))}
 fail();
}
function logBase(base,value){if(!finite(base)||!finite(value)||base<=0||base===1||value<=0)fail();return checked(Math.log(value)/Math.log(base))}
/** Real n-th root, including negative radicands for odd integer index. */
function nthRoot(index,value){
 if(!finite(index)||!finite(value)||index===0||(value===0&&index<0))fail();
 if(value<0){if(!Number.isInteger(index)||Math.abs(index)%2!==1)fail();return checked(-Math.pow(-value,1/index))}
 return checked(Math.pow(value,1/index));
}

exports.toDMS=toDMS;
exports.fromDMS=fromDMS;
exports.primeFactors=primeFactors;
exports.engineering=engineering;
exports.polar=polar;
exports.rectangular=rectangular;
exports.roundToDisplay=roundToDisplay;
exports.logBase=logBase;
exports.nthRoot=nthRoot;
},
"engine.js":(exports,require)=>{
const {logBase, nthRoot}=require("scientific.js");
/** Real-number expression evaluator; no dynamic code execution. */
function evaluate(expression, options = {}) {
  const source = String(expression).replace(/[π×÷−√]/g, c => ({'π':'pi','×':'*','÷':'/','−':'-','√':'sqrt'}[c]));
  const tokens = []; let i = 0;
  while (i < source.length) {
    if (/\s/.test(source[i])) { i++; continue; }
    const rest = source.slice(i);
    const n = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (n) { tokens.push({type:'number', value:Number(n[0])}); i += n[0].length; continue; }
    const w = rest.match(/^[a-zA-Z]+/);
    if (w) { const word=w[0]; const named=/^(?:sin|cos|tan|asin|acos|atan|sinh|cosh|tanh|asinh|acosh|atanh|sqrt|cbrt|log|ln|abs|exp|pow|logbase|nthroot|npr|ncr|mix|pi|ans)$/i.test(word); if(!named && word.length>1 && /^[A-FxyMe]+$/.test(word)){for(const c of word) tokens.push({type:'word',value:c});}else tokens.push({type:'word',value:word}); i += word.length; continue; }
    if ('+-*/^()!%,'.includes(source[i])) { tokens.push({type:source[i++]}); continue; }
    throw Error('Syntax ERROR');
  }
  tokens.push({type:'end'}); let pos = 0;
  const peek = () => tokens[pos];
  const take = type => { if (peek().type !== type) throw Error('Syntax ERROR'); return tokens[pos++]; };
  const checked = n => { if (!Number.isFinite(n)) throw Error('Math ERROR'); return Object.is(n,-0) ? 0 : n; };
  const unit = options.angle ?? 'DEG';
  if (!['DEG','RAD','GRAD'].includes(unit)) throw Error('Syntax ERROR');
  const factor = unit === 'RAD' ? 1 : Math.PI / (unit === 'GRAD' ? 200 : 180);
  const rad = n => n * factor;
  const angle = n => n / factor;
  const integerPair = (n, r) => {
    if (!Number.isInteger(n) || !Number.isInteger(r) || n < 0 || r < 0 || r > n || n > 170) throw Error('Math ERROR');
  };
  const funcs = {
    sin:n=>Math.sin(rad(n)), cos:n=>Math.cos(rad(n)),
    tan:n=>{const r=rad(n); if(Math.abs(Math.cos(r))<1e-14) throw Error('Math ERROR'); return Math.tan(r);},
    asin:n=>angle(Math.asin(n)), acos:n=>angle(Math.acos(n)), atan:n=>angle(Math.atan(n)),
    sinh:Math.sinh, cosh:Math.cosh, tanh:Math.tanh,
    asinh:Math.asinh, acosh:Math.acosh, atanh:Math.atanh,
    sqrt:Math.sqrt, cbrt:Math.cbrt, log:Math.log10, ln:Math.log, abs:Math.abs,
    exp:Math.exp, pow10:n=>10**n,
    logbase:logBase, nthroot:nthRoot,
    mix:(w,n,d)=>{if(![w,n,d].every(Number.isSafeInteger)||w<0||n<0||d<=0)throw Error("Math ERROR");return checked(w+n/d);},
    npr:(n,r)=>{integerPair(n,r);let v=1;for(let i=0;i<r;i++)v*=n-i;return v;},
    ncr:(n,r)=>{integerPair(n,r);r=Math.min(r,n-r);let v=1;for(let i=1;i<=r;i++)v=v*(n-r+i)/i;return Math.round(v);}
  };
  const constants = {pi:Math.PI, e:Math.E, ans:options.ans??0, m:options.memory??0};
  function primary() {
    let value;
    if (peek().type === 'number') value = take('number').value;
    else if (peek().type === '(') { take('('); value = sum(); take(')'); }
    else if (peek().type === 'word') {
      const rawName = take('word').value;
      const name = rawName.toLowerCase();
      const variables = options.variables || {};
      if (Object.hasOwn(variables,rawName)) value=variables[rawName];
      else if (Object.hasOwn(funcs,name)) {
        take('('); const args=[sum()]; while(peek().type===',') {take(',');args.push(sum());} take(')');
        const arity = name==='mix'?3:['logbase','nthroot','npr','ncr'].includes(name) ? 2 : 1;
        if(args.length!==arity) throw Error('Syntax ERROR');
        value=funcs[name](...args);
      }
      else if (Object.hasOwn(constants,name)) value=constants[name];
      else throw Error('Syntax ERROR');
    } else throw Error('Syntax ERROR');
    while (peek().type==='!' || peek().type==='%') {
      if (peek().type==='%') { take('%'); value/=100; }
      else { take('!'); if(!Number.isInteger(value)||value<0||value>170) throw Error('Math ERROR'); let f=1; for(let j=2;j<=value;j++) f*=j; value=f; }
    }
    return checked(value);
  }
  function power() { let n=primary(); if(peek().type==='^') {take('^'); n=checked(n**unary());} return n; }
  function unary() { if(peek().type==='+'){take('+');return unary();} if(peek().type==='-'){take('-');return checked(-unary());} return power(); }
  function product() { let n=unary(); while(['*','/','(','word'].includes(peek().type)) { const op=peek().type; if(op==='*'||op==='/') take(op); const rhs=unary(); n=checked(op==='/'?n/rhs:n*rhs); } return n; }
  function sum() { let n=product(); while(peek().type==='+'||peek().type==='-') { const op=tokens[pos++].type; const rhs=product(); n=checked(op==='+'?n+rhs:n-rhs); } return n; }
  const result=sum(); take('end'); return checked(result);
}

function formatResult(value) {
  if (!Number.isFinite(value)) throw Error('Math ERROR');
  if (value === 0) return '0';
  return Number(value.toPrecision(10)).toString().replace('e+', '×10^').replace('e-', '×10^-');
}

exports.evaluate=evaluate;
exports.formatResult=formatResult;
},
"exact.js":(exports,require)=>{
/** Exact rational and quadratic-surd arithmetic, independent of firmware.
 * Unsupported expressions return null; the caller can show a numerical result.
 * Values are finite sums of rational multiples of square roots of square-free integers.
 */
const LIMIT=1000000000000n;
const abs=n=>n<0n?-n:n;
function gcd(a,b){a=abs(a);b=abs(b);while(b){[a,b]=[b,a%b]}return a;}
function rat(n,d=1n){if(!d)throw Error('division by zero');if(d<0n){n=-n;d=-d}const g=gcd(n,d);return {n:n/g,d:d/g};}
const addR=(a,b)=>rat(a.n*b.d+b.n*a.d,a.d*b.d);
const mulR=(a,b)=>rat(a.n*b.n,a.d*b.d);
const divR=(a,b)=>rat(a.n*b.d,a.d*b.n);
function simple(n){if(n<0n||n>LIMIT)throw Error('unsupported radical');let outside=1n, inside=n;for(let p=2n;p*p<=inside;p+=(p===2n?1n:2n)){const square=p*p;while(inside%square===0n){outside*=p;inside/=square}}return [outside,inside];}
function one(q){return new Map(q.n?[[1n,q]]:[])}
function add(a,b,sign=1n){let r=new Map(a);for(const [k,v] of b){let q=addR(r.get(k)||rat(0n),rat(v.n*sign,v.d));if(q.n)r.set(k,q);else r.delete(k)}return r;}
function multiply(a,b){let r=new Map();for(const [x,a1] of a)for(const [y,b1] of b){const [c,k]=simple(x*y);let v=mulR(mulR(a1,b1),rat(c));r=add(r,new Map([[k,v]]))}return r;}
function divide(a,b){if(b.size!==1)throw Error('unsupported denominator');const [[rad,q]]=b; if(!q.n)throw Error('division by zero');return multiply(a,new Map([[rad,divR(rat(1n),mulR(q,rat(rad)))]]));}
function rationalValue(a){if(a.size===0)return rat(0n);if(a.size===1&&a.has(1n))return a.get(1n);throw Error('not rational');}
function squareRoot(a){const q=rationalValue(a);if(q.n<0n)throw Error('negative root');if(!q.n)return one(q);const [outer,inner]=simple(q.n*q.d);return new Map([[inner,rat(outer,q.d)]]);}
function pow(a,n){if(n>100n||n< -100n)throw Error('unsupported power');let v=one(rat(1n)),base=a;let exponent=abs(n);while(exponent){if(exponent%2n)v=multiply(v,base);exponent/=2n;if(exponent)base=multiply(base,base)}return n<0n?divide(one(rat(1n)),v):v;}
function literal(text){let [whole,fraction='']=text.split('.');whole=whole||'0';return rat(BigInt(whole+fraction),10n**BigInt(fraction.length));}
function render(a){if(!a.size)return '0';let terms=[];for(const [rad,q] of [...a.entries()].sort((x,y)=>x[0]<y[0]?-1:1)){if(!q.n)continue;let n=abs(q.n), piece;if(rad===1n)piece=q.d===1n?`${n}`:`${n}/${q.d}`;else {let coeff=n===1n?'':`${n}`;piece=`${coeff}√${rad}`;if(q.d!==1n)piece+=`/${q.d}`;}terms.push({negative:q.n<0n,piece});}return terms.map((x,i)=>(x.negative?'−':i?' + ':'')+x.piece).join('').replaceAll('−',' − ').trim().replace(/^− /,'−');}
/** Return an exact representation or null when expression is outside supported subset.
 * Expressions use dot decimal separator and the same operators as evaluate().
 * The caller must validate numerical/domain errors using evaluate first.
 */
function exactResult(expression){try{
 if(String(expression).length>256)throw Error('expression too long');
 const src=String(expression).replace(/[×÷−π√]/g,c=>({'×':'*','÷':'/','−':'-','π':'pi','√':'sqrt'}[c]));
 const tokens=[];let i=0;while(i<src.length){if(/\s/.test(src[i])){i++;continue}const num=src.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/);if(num){tokens.push({t:'n',v:num[0]});i+=num[0].length;continue}const word=src.slice(i).match(/^[a-zA-Z]+/);if(word){tokens.push({t:'w',v:word[0].toLowerCase()});i+=word[0].length;continue}if('+-*/^(),'.includes(src[i]))tokens.push({t:src[i++]});else throw Error('unsupported token');}tokens.push({t:'end'});let p=0;const peek=()=>tokens[p].t;const take=t=>{if(peek()!==t)throw Error('syntax');return tokens[p++]};
 function primary(){if(peek()==='n')return one(literal(take('n').v));if(peek()==='('){take('(');let n=sum();take(')');return n}if(peek()==='w'){let w=take('w').v;if(w==='mix'){take('(');let whole=rationalValue(sum());take(',');let numerator=rationalValue(sum());take(',');let denominator=rationalValue(sum());take(')');if([whole,numerator,denominator].some(q=>q.d!==1n)||whole.n<0n||numerator.n<0n||denominator.n<=0n)throw Error('invalid mixed number');return one(addR(whole,divR(numerator,denominator)))}if(w!=='sqrt')throw Error('unsupported function');take('(');let n=squareRoot(sum());take(')');return n}throw Error('syntax')}
 function power(){let n=primary();if(peek()==='^'){take('^');const q=rationalValue(unary());if(q.d!==1n)throw Error('unsupported power');n=pow(n,q.n)}return n}
 function unary(){if(peek()==='+'){take('+');return unary()}if(peek()==='-'){take('-');return multiply(one(rat(-1n)),unary())}return power()}
 function product(){let n=unary();while(['*','/','(','w'].includes(peek())){let op=peek();if(op==='*'||op==='/')take(op);let v=unary();n=op==='/'?divide(n,v):multiply(n,v)}return n}
 function sum(){let n=product();while(peek()==='+'||peek()==='-'){let op=tokens[p++].t;let v=product();n=add(n,v,op==='+'?1n:-1n)}return n}
 const val=sum();take('end');return render(val);
 }catch{return null}}

exports.exactResult=exactResult;
},
"modes.js":(exports,require)=>{
/** Independent numerical tools for selected fx-991LA X modes.
 * Floating-point results are approximations; see MODES.md. */
const {evaluate}=require("engine.js");
const fail = () => { throw Error('Math ERROR'); };
const finite = n => { if (!Number.isFinite(n)) fail(); return Object.is(n, -0) ? 0 : n; };
const z = (re, im=0) => ({re:finite(Number(re)), im:finite(Number(im))});
const asComplex = v => typeof v === 'string' ? parseComplex(v) : typeof v === 'number' ? z(v) : z(v?.re,v?.im);

/** Parse rectangular a+bi, a-bi, pure bi/i or a real number. */
function parseComplex(value) {
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
function complexOperation(a, op, b) {
  const x=asComplex(a), y=asComplex(b);
  switch(op) {
    case '+': return z(x.re+y.re,x.im+y.im);
    case '-': return z(x.re-y.re,x.im-y.im);
    case '*': case '×': return z(x.re*y.re-x.im*y.im,x.re*y.im+x.im*y.re);
    case '/': case '÷': { const d=y.re*y.re+y.im*y.im; if(!d) fail(); return z((x.re*y.re+x.im*y.im)/d,(x.im*y.re-x.re*y.im)/d); }
    default: throw Error('Syntax ERROR');
  }
}
function complexPolar(a, angle='DEG') {
  const c=asComplex(a); let theta=Math.atan2(c.im,c.re);
  if(angle==='DEG') theta*=180/Math.PI; else if(angle==='GRAD') theta*=200/Math.PI; else if(angle!=='RAD') throw Error('Syntax ERROR');
  return {radius:finite(Math.hypot(c.re,c.im)), angle:finite(theta)};
}
function complexFromPolar(radius, theta, angle='DEG') {
  radius=Number(radius); theta=Number(theta); if(radius<0 || !Number.isFinite(radius) || !Number.isFinite(theta)) fail();
  if(angle==='DEG') theta*=Math.PI/180; else if(angle==='GRAD') theta*=Math.PI/200; else if(angle!=='RAD') throw Error('Syntax ERROR');
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
function baseConvert(value, from, to) {return writeBase(readBase(value,from),to);}
function baseOperation(a, op, b, base) {
  const x=readBase(a,base), y=readBase(b,base); let r;
  switch(op.toLowerCase()) {
    case '+': r=x+y; break; case '-': r=x-y; break; case '*': case '×': r=x*y; break;
    case '/': case '÷': if(y===0n) fail(); r=x/y; break;
    case 'and': r=x&y; break; case 'or': r=x|y; break; case 'xor': r=x^y; break; case 'xnor': r=~(x^y); break;
    default: throw Error('Syntax ERROR');
  }
  return writeBase(r,base);
}
function baseNot(a,base) {return writeBase(~readBase(a,base),base);}

/** Evaluate up to two expressions containing X over a finite, bounded range. */
function makeTable(f, g, start, end, step, options={}) {
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
function solveProportion(a,b,value,missing='C') {
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
function solveInequality(coefficients,relation) {
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

exports.parseComplex=parseComplex;
exports.complexOperation=complexOperation;
exports.complexPolar=complexPolar;
exports.complexFromPolar=complexFromPolar;
exports.baseConvert=baseConvert;
exports.baseOperation=baseOperation;
exports.baseNot=baseNot;
exports.makeTable=makeTable;
exports.solveProportion=solveProportion;
exports.solveInequality=solveInequality;
},
"linear.js":(exports,require)=>{
/* Numerical linear algebra and polynomial solving for fx-991LA X modes.
 * All values use JavaScript double precision; matrices are arrays of rows.
 */
const EPS = 1e-12;
const fail = (msg='Math ERROR') => { throw new Error(msg); };
function number(x) { if (typeof x !== 'number' || !Number.isFinite(x)) fail(); return x; }
function shape(a) {
  if (!Array.isArray(a) || a.length < 1 || a.length > 4 || !Array.isArray(a[0]) || a[0].length < 1 || a[0].length > 4) fail('Dimension ERROR');
  const n=a[0].length;
  for (const row of a) { if (!Array.isArray(row) || row.length!==n) fail('Dimension ERROR'); row.forEach(number); }
  return [a.length,n];
}
function same(a,b) { const x=shape(a),y=shape(b); if (x[0]!==y[0] || x[1]!==y[1]) fail('Dimension ERROR'); return x; }
function matrixAdd(a,b) { same(a,b); return a.map((r,i)=>r.map((v,j)=>v+b[i][j])); }
function matrixSubtract(a,b) { same(a,b); return a.map((r,i)=>r.map((v,j)=>v-b[i][j])); }
function matrixScale(a,s) { shape(a); number(s); return a.map(r=>r.map(v=>v*s)); }
function matrixMultiply(a,b) { const [m,n]=shape(a),[p,q]=shape(b); if(n!==p) fail('Dimension ERROR'); return Array.from({length:m},(_,i)=>Array.from({length:q},(_,j)=>a[i].reduce((sum,v,k)=>sum+v*b[k][j],0))); }
function matrixTranspose(a) { const [m,n]=shape(a); return Array.from({length:n},(_,j)=>Array.from({length:m},(_,i)=>a[i][j])); }
function matrixIdentity(n) { if (!Number.isInteger(n)||n<1||n>4) fail('Dimension ERROR'); return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j))); }
function square(a) { const [n,m]=shape(a); if(n!==m) fail('Dimension ERROR'); return n; }
// Scaled partial pivoting guards against false singularity on small matrices.
function pivotRow(a,k) { let best=-1,idx=k; for(let i=k;i<a.length;i++){ const scale=Math.max(...a[i].slice(0,a.length).map(Math.abs)); const ratio=scale?Math.abs(a[i][k])/scale:0; if(ratio>best){best=ratio;idx=i;} } return [idx,best]; }
function determinant(a) {
  const n=square(a), w=a.map(r=>r.slice()); let sign=1, result=1;
  for(let k=0;k<n;k++) { const [p,ratio]=pivotRow(w,k); if(ratio<EPS) return 0; if(p!==k){[w[p],w[k]]=[w[k],w[p]];sign=-sign;} const v=w[k][k];result*=v; for(let i=k+1;i<n;i++){const f=w[i][k]/v;for(let j=k+1;j<n;j++)w[i][j]-=f*w[k][j];w[i][k]=0;} }
  return sign*result;
}
function solveSystem(a,b) {
  const n=square(a); if(!Array.isArray(b)||b.length!==n) fail('Dimension ERROR'); b.forEach(number);
  const w=a.map((r,i)=>[...r,b[i]]);
  for(let k=0;k<n;k++){const [p,ratio]=pivotRow(w,k);if(ratio<EPS) fail('Singular matrix');if(p!==k)[w[p],w[k]]=[w[k],w[p]];for(let i=k+1;i<n;i++){const f=w[i][k]/w[k][k];for(let j=k;j<=n;j++)w[i][j]-=f*w[k][j];}}
  const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let v=w[i][n];for(let j=i+1;j<n;j++)v-=w[i][j]*x[j];x[i]=v/w[i][i];if(!Number.isFinite(x[i]))fail();}return x;
}
function matrixInverse(a) { const n=square(a), columns=matrixIdentity(n).map(row=>solveSystem(a,row)); return matrixTranspose(columns); }
function vec(v) {if(!Array.isArray(v)||![2,3].includes(v.length))fail('Dimension ERROR');v.forEach(number);return v.length;}
function pair(a,b) {if(vec(a)!==vec(b))fail('Dimension ERROR');}
function vectorAdd(a,b){pair(a,b);return a.map((x,i)=>x+b[i]);}
function vectorSubtract(a,b){pair(a,b);return a.map((x,i)=>x-b[i]);}
function vectorScale(a,s){vec(a);number(s);return a.map(x=>x*s);}
function vectorDot(a,b){pair(a,b);return a.reduce((sum,x,i)=>sum+x*b[i],0);}
function vectorCross(a,b){pair(a,b);if(a.length!==3)fail('Dimension ERROR');return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
function vectorNorm(a){vec(a);return Math.hypot(...a);}
function vectorUnit(a){const n=vectorNorm(a);if(n===0)fail();return a.map(v=>v/n);}
function vectorAngle(a,b,angle='DEG'){pair(a,b);const n=vectorNorm(a)*vectorNorm(b);if(n===0)fail();const value=Math.acos(Math.max(-1,Math.min(1,vectorDot(a,b)/n)));if(!['DEG','RAD','GRAD'].includes(angle))fail();return angle==='RAD'?value:value*(angle==='GRAD'?200:180)/Math.PI;}

// Roots are complex {re, im}; quadratic uses a stable formula. Cubic/quartic
// use Durand–Kerner with a convergence/residual check, so failure is explicit.
const add=(a,b)=>({re:a.re+b.re,im:a.im+b.im}), sub=(a,b)=>({re:a.re-b.re,im:a.im-b.im});
const mul=(a,b)=>({re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re});
const div=(a,b)=>{const d=b.re*b.re+b.im*b.im;if(d===0)fail('Root solver did not converge');return {re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};};
const abs=z=>Math.hypot(z.re,z.im);
function poly(coeff,z){return coeff.reduce((v,c)=>add(mul(v,z),{re:c,im:0}),{re:0,im:0});}
function polynomialRoots(coefficients) {
  if(!Array.isArray(coefficients)||coefficients.length<3||coefficients.length>5) fail('Dimension ERROR'); coefficients.forEach(number);
  const n=coefficients.length-1, leading=coefficients[0];if(leading===0)fail('Leading coefficient is zero');
  const c=coefficients.map(x=>x/leading);
  // Real repeated roots are stationary roots of the polynomial. Deflate a
  // numerically verified repeated root before the simultaneous solver.
  if(n>2){
    const derivative=c.slice(0,-1).map((x,i)=>x*(n-i));
    let critical=[]; try { critical=polynomialRoots(derivative); } catch { /* simple roots still use Durand–Kerner */ }
    for(const z of critical){
      if(Math.abs(z.im)>1e-8*(1+Math.abs(z.re))) continue;
      const x=z.re, scale=c.reduce((s,v,i)=>s+Math.abs(v)*Math.abs(x)**(n-i),0);
      if(Math.abs(poly(c,{re:x,im:0}).re)>1e-12*Math.max(1,scale)) continue;
      const quotient=[c[0]]; for(let i=1;i<n;i++) quotient.push(c[i]+x*quotient[i-1]);
      const remaining=quotient.length===2?[{re:-quotient[1]/quotient[0],im:0}]:polynomialRoots(quotient);
      return [{re:x,im:0},...remaining].sort((a,b)=>a.re-b.re||a.im-b.im);
    }
  }
  if(n===2){const b=c[1],d=b*b-4*c[2];if(d<0){const im=Math.sqrt(-d)/2;return [{re:-b/2,im},{re:-b/2,im:-im}];} const q=-0.5*(b+(b>=0?1:-1)*Math.sqrt(d));return q===0?[{re:0,im:0},{re:0,im:0}]:[{re:q,im:0},{re:c[2]/q,im:0}];}
  const radius=1+Math.max(...c.slice(1).map(Math.abs));let roots=Array.from({length:n},(_,i)=>{const t=2*Math.PI*(i+.37)/n;return {re:radius*Math.cos(t),im:radius*Math.sin(t)};});
  let converged=false;for(let iteration=0;iteration<2000;iteration++){let max=0;const next=roots.map((z,i)=>{let denom={re:1,im:0};for(let j=0;j<n;j++)if(j!==i)denom=mul(denom,sub(z,roots[j]));const delta=div(poly(c,z),denom);max=Math.max(max,abs(delta));return sub(z,delta);});roots=next;if(max<1e-11*(1+radius)){converged=true;break;}}
  if(!converged)fail('Root solver did not converge');
  const tolerance=1e-8*(1+Math.max(...c.map(Math.abs)))*(1+radius)**n;
  if(roots.some(z=>!Number.isFinite(z.re)||!Number.isFinite(z.im)||abs(poly(c,z))>tolerance))fail('Root solver did not converge');
  return roots.map(z=>({re:Math.abs(z.re)<1e-12?0:z.re,im:Math.abs(z.im)<1e-10*(1+Math.abs(z.re))?0:z.im})).sort((a,b)=>a.re-b.re||a.im-b.im);
}

exports.matrixAdd=matrixAdd;
exports.matrixSubtract=matrixSubtract;
exports.matrixScale=matrixScale;
exports.matrixMultiply=matrixMultiply;
exports.matrixTranspose=matrixTranspose;
exports.matrixIdentity=matrixIdentity;
exports.determinant=determinant;
exports.solveSystem=solveSystem;
exports.matrixInverse=matrixInverse;
exports.vectorAdd=vectorAdd;
exports.vectorSubtract=vectorSubtract;
exports.vectorScale=vectorScale;
exports.vectorDot=vectorDot;
exports.vectorCross=vectorCross;
exports.vectorNorm=vectorNorm;
exports.vectorUnit=vectorUnit;
exports.vectorAngle=vectorAngle;
exports.polynomialRoots=polynomialRoots;
},
"statistics.js":(exports,require)=>{
/* Scientific statistics and probability. All numeric outputs are IEEE-754 doubles. */
const err=()=>{throw new RangeError('Math ERROR')};
const finite=x=>typeof x==='number'&&Number.isFinite(x);
function rows(data, pairs=false){
 if(!Array.isArray(data)||!data.length)err();
 const out=data.map(row=>{
  const v=Array.isArray(row)?row:[row]; const x=v[0], y=pairs?v[1]:undefined, f=(pairs?v[2]:v[1])??1;
  if(!finite(x)||(pairs&&!finite(y))||!Number.isSafeInteger(f)||f<0)err(); return {x,y,f};
 });
 if(!out.some(r=>r.f>0))err(); return out;
}
function medianAt(sorted,start,len){if(!len)return NaN;let get=(idx)=>{let sum=0;for(const r of sorted){sum+=r.f;if(idx<sum)return r.x}return NaN};let m=start+(len-1)/2;return (get(Math.floor(m))+get(Math.ceil(m)))/2}
function oneVariable(data){
 const r=rows(data);const n=r.reduce((s,a)=>s+a.f,0);if(n>Number.MAX_SAFE_INTEGER)err();
 const sum=r.reduce((s,a)=>s+a.x*a.f,0), sumSquares=r.reduce((s,a)=>s+a.x*a.x*a.f,0),mean=sum/n;
 const ss=r.reduce((s,a)=>s+a.f*(a.x-mean)**2,0);const sorted=r.filter(a=>a.f).sort((a,b)=>a.x-b.x);
 let half=Math.floor(n/2); return {n,sum,sumSquares,mean,populationSD:Math.sqrt(ss/n),sampleSD:n>1?Math.sqrt(ss/(n-1)):NaN,min:sorted[0].x,q1:medianAt(sorted,0,half),median:medianAt(sorted,0,n),q3:medianAt(sorted,n-half,half),max:sorted.at(-1).x};
}
function twoVariable(data){
 const r=rows(data,true), n=r.reduce((s,a)=>s+a.f,0), sx=r.reduce((s,a)=>s+a.x*a.f,0),sy=r.reduce((s,a)=>s+a.y*a.f,0),sxx=r.reduce((s,a)=>s+a.x*a.x*a.f,0),syy=r.reduce((s,a)=>s+a.y*a.y*a.f,0),sxy=r.reduce((s,a)=>s+a.x*a.y*a.f,0);
 const ssx=r.reduce((s,a)=>s+a.f*(a.x-sx/n)**2,0), ssy=r.reduce((s,a)=>s+a.f*(a.y-sy/n)**2,0);
 return {n,sumX:sx,sumY:sy,sumX2:sxx,sumY2:syy,sumXY:sxy,meanX:sx/n,meanY:sy/n,populationSDX:Math.sqrt(ssx/n),populationSDY:Math.sqrt(ssy/n),sampleSDX:n>1?Math.sqrt(ssx/(n-1)):NaN,sampleSDY:n>1?Math.sqrt(ssy/(n-1)):NaN};
}
function solve3(m,b){m=m.map((row,i)=>[...row,b[i]]);for(let k=0;k<3;k++){let p=k;for(let i=k+1;i<3;i++)if(Math.abs(m[i][k])>Math.abs(m[p][k]))p=i;[m[k],m[p]]=[m[p],m[k]];if(Math.abs(m[k][k])<1e-14)err();let x=m[k][k];for(let j=k;j<4;j++)m[k][j]/=x;for(let i=0;i<3;i++)if(i!==k){x=m[i][k];for(let j=k;j<4;j++)m[i][j]-=x*m[k][j]}}return m.map(row=>row[3])}
/** Models: linear, quadratic, logarithmic, exponential, power, inverse.
 * Returns a,b,c,r where relevant and predict(x). */
function regression(data,model='linear'){
 let r=rows(data,true);if(model==='quadratic'){
  const s=k=>r.reduce((v,a)=>v+a.f*a.x**k,0),t=k=>r.reduce((v,a)=>v+a.f*a.y*a.x**k,0);
  const [a,b,c]=solve3([[s(0),s(1),s(2)],[s(1),s(2),s(3)],[s(2),s(3),s(4)]],[t(0),t(1),t(2)]);return {a,b,c,predict:x=>a+b*x+c*x*x};
 }
 if(!['linear','logarithmic','exponential','power','inverse'].includes(model))err();
 const transformed=r.map(({x,y,f})=>{if((['logarithmic','power'].includes(model)&&x<=0)||(['exponential','power'].includes(model)&&y<=0)||(model==='inverse'&&x===0))err();return {x:['logarithmic','power'].includes(model)?Math.log(x):model==='inverse'?1/x:x,y:['exponential','power'].includes(model)?Math.log(y):y,f}});
 const n=transformed.reduce((v,a)=>v+a.f,0), mx=transformed.reduce((v,a)=>v+a.f*a.x,0)/n,my=transformed.reduce((v,a)=>v+a.f*a.y,0)/n;
 const xx=transformed.reduce((v,a)=>v+a.f*(a.x-mx)**2,0), yy=transformed.reduce((v,a)=>v+a.f*(a.y-my)**2,0),xy=transformed.reduce((v,a)=>v+a.f*(a.x-mx)*(a.y-my),0);if(!xx)err();
 const b=xy/xx, intercept=my-b*mx, a=['exponential','power'].includes(model)?Math.exp(intercept):intercept;
 const predict=x=>{if(!finite(x)||(['logarithmic','power'].includes(model)&&x<=0)||(model==='inverse'&&x===0))err();return model==='exponential'?a*Math.exp(b*x):model==='power'?a*x**b:model==='logarithmic'?a+b*Math.log(x):model==='inverse'?a+b/x:a+b*x};
 return {a,b,r:yy?xy/Math.sqrt(xx*yy):NaN,predict};
}
function validNormal(mu,sigma){if(!finite(mu)||!finite(sigma)||sigma<=0)err()}
// Error-function approximation; absolute normal-CDF error is about 8e-8.
function erf(x){const sign=Math.sign(x);x=Math.abs(x);const t=1/(1+0.3275911*x);return sign*(1-(((((1.061405429*t-1.453152027)*t+1.421413741)*t-0.284496736)*t+0.254829592)*t)*Math.exp(-x*x))}
function normalPDF(x,mu=0,sigma=1){validNormal(mu,sigma);if(!finite(x))err();let z=(x-mu)/sigma;return Math.exp(-z*z/2)/(sigma*Math.sqrt(2*Math.PI))}
function normalCDF(x,mu=0,sigma=1){validNormal(mu,sigma);if(x===Infinity)return 1;if(x===-Infinity)return 0;if(!finite(x))err();return (1+erf((x-mu)/(sigma*Math.SQRT2)))/2}
function normalInterval(lower,upper,mu=0,sigma=1){if(lower>upper)err();return normalCDF(upper,mu,sigma)-normalCDF(lower,mu,sigma)}
// Acklam's inverse normal approximation, followed by Newton refinement.
function inverseNormal(p,mu=0,sigma=1){validNormal(mu,sigma);if(!finite(p)||p<=0||p>=1)err();
 const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];
 let q,x;if(p<.02425){q=Math.sqrt(-2*Math.log(p));x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}else if(p>1-.02425){q=Math.sqrt(-2*Math.log(1-p));x=-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}else{q=p-.5;let z=q*q;x=(((((a[0]*z+a[1])*z+a[2])*z+a[3])*z+a[4])*z+a[5])*q/(((((b[0]*z+b[1])*z+b[2])*z+b[3])*z+b[4])*z+1)}return mu+sigma*x;
}
const logFactorials=[0];
function logFactorial(n){if(n>10000)err();for(let i=logFactorials.length;i<=n;i++)logFactorials[i]=logFactorials[i-1]+Math.log(i);return logFactorials[n]}
function validBinomial(n,p){if(!Number.isSafeInteger(n)||n<0||n>10000||!finite(p)||p<0||p>1)err()}
function binomialPDF(x,n,p){validBinomial(n,p);if(!Number.isSafeInteger(x))err();if(x<0||x>n)return 0;if(p===0)return x===0?1:0;if(p===1)return x===n?1:0;return Math.exp(logFactorial(n)-logFactorial(x)-logFactorial(n-x)+x*Math.log(p)+(n-x)*Math.log1p(-p))}
function binomialCDF(x,n,p){validBinomial(n,p);if(!Number.isSafeInteger(x))err();if(x<0)return 0;if(x>=n)return 1;let s=0;for(let k=0;k<=x;k++)s+=binomialPDF(k,n,p);return Math.min(1,s)}
function validPoisson(lambda){if(!finite(lambda)||lambda<0||lambda>10000)err()}
function poissonPDF(x,lambda){validPoisson(lambda);if(!Number.isSafeInteger(x))err();if(x<0)return 0;if(lambda===0)return x===0?1:0;return Math.exp(-lambda+x*Math.log(lambda)-logFactorial(x))}
function poissonCDF(x,lambda){validPoisson(lambda);if(!Number.isSafeInteger(x))err();if(x<0)return 0;if(x>10000)err();let s=0;for(let k=0;k<=x;k++)s+=poissonPDF(k,lambda);return Math.min(1,s)}

exports.oneVariable=oneVariable;
exports.twoVariable=twoVariable;
exports.regression=regression;
exports.normalPDF=normalPDF;
exports.normalCDF=normalCDF;
exports.normalInterval=normalInterval;
exports.inverseNormal=inverseNormal;
exports.binomialPDF=binomialPDF;
exports.binomialCDF=binomialCDF;
exports.poissonPDF=poissonPDF;
exports.poissonCDF=poissonCDF;
},
"calculus.js":(exports,require)=>{
const { evaluate }=require("engine.js");
const fail = () => { throw Error('Math ERROR'); };
function real(n) { if (typeof n !== 'number' || !Number.isFinite(n)) fail(); return n; }
function value(expression, x, options) { return real(evaluate(expression, { ...options, variables: { ...options.variables, x } })); }

/** Central difference with Richardson refinement. Numeric approximation, not symbolic. */
function derivative(expression, x, options = {}) {
  real(x);
  const h = Math.cbrt(Number.EPSILON) * Math.max(1, Math.abs(x));
  const d1 = (value(expression, x+h, options) - value(expression, x-h, options)) / (2*h);
  const d2 = (value(expression, x+h/2, options) - value(expression, x-h/2, options)) / h;
  const result = (4*d2-d1)/3;
  if (Math.abs(d2-d1) > 1e-4 * Math.max(1, Math.abs(result))) fail();
  return real(result);
}

/** Adaptive Simpson quadrature, limited to finite intervals and bounded work. */
function integral(expression, a, b, options = {}) {
  real(a); real(b);
  if (a === b) return 0;
  if (a > b) return -integral(expression, b, a, options);
  let budget = 50000;
  const f = x => { if (--budget < 0) fail(); return value(expression, x, options); };
  const simp = (a,b,fa,fm,fb) => (b-a)*(fa+4*fm+fb)/6;
  const mid = (a+b)/2, fa=f(a), fm=f(mid), fb=f(b);
  const initial = simp(a,b,fa,fm,fb);
  const tolerance = 1e-10 * Math.max(1, Math.abs(initial));
  function recurse(a,b,fa,fm,fb,whole,tol,depth) {
    const m=(a+b)/2, lm=(a+m)/2, rm=(m+b)/2;
    const fl=f(lm), fr=f(rm), left=simp(a,m,fa,fl,fm), right=simp(m,b,fm,fr,fb);
    const delta=left+right-whole;
    if (Math.abs(delta)<=15*tol) return left+right+delta/15;
    if (depth===0) fail();
    return recurse(a,m,fa,fl,fm,left,tol/2,depth-1)+recurse(m,b,fm,fr,fb,right,tol/2,depth-1);
  }
  return real(recurse(a,b,fa,fm,fb,initial,tolerance,20));
}

/** Inclusive integer sigma with compensated summation and a finite iteration limit. */
function summation(expression, from, to, options = {}) {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to < from || to-from > 99999) fail();
  let sum=0, compensation=0;
  for (let x=from; x<=to; x++) {
    const y=value(expression,x,options)-compensation;
    const next=sum+y; compensation=(next-sum)-y; sum=next;
  }
  return real(sum);
}

exports.derivative=derivative;
exports.integral=integral;
exports.summation=summation;
},
"solve.js":(exports,require)=>{
const { evaluate }=require("engine.js");
const VARIABLE_NAMES = new Set(['A','B','C','D','E','F','x','y','M']);
const fail = message => { throw new Error(message); };

/** List variables recognized by the real evaluator, without confusing e, Ans, or function names. */
function expressionVariables(expression) {
  const text=String(expression), variables=[];
  // Follow the evaluator's number/word lexical boundaries, including scientific notation.
  const tokenPattern=/(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+/g;
  for(const match of text.matchAll(tokenPattern)) {
    const token=match[0];
    // The evaluator treats adjacent one-letter variables such as Ax as products.
    const names=VARIABLE_NAMES.has(token)?[token]:/^[A-FMxy]+$/.test(token)?[...token]:[];
    for(const name of names) if(!variables.includes(name))variables.push(name);
  }
  return variables;
}
function equationParts(expression) {
  const text=String(expression).trim();
  if(!text) fail('Syntax ERROR');
  const parts=text.split('=');
  if(parts.length>2 || parts.some(part=>!part.trim())) fail('Syntax ERROR');
  return [parts[0],parts.length===2?parts[1]:null];
}
function checkValues(names, variables, ignored) {
  for(const name of names) if(name!==ignored&&(!Object.hasOwn(variables,name)||typeof variables[name]!=='number'||!Number.isFinite(variables[name]))) fail(`Variable ERROR: ${name}`);
}
function sides(parts, variables, options) {
  const settings={...options,variables};
  const left=evaluate(parts[0],settings),right=parts[1]===null?0:evaluate(parts[1],settings);
  const residual=left-right;
  if(!Number.isFinite(residual)) fail('Math ERROR');
  return {left,right,residual};
}
/** CALC: substitute the supplied numeric variables; for an equality return L−R. */
function calculate(expression, variables={}, options={}) {
  const parts=equationParts(expression);checkValues(expressionVariables(expression),variables);
  return sides(parts,variables,options).residual;
}
/**
 * SOLVE: safeguarded Newton iteration for a real root, initialized by the caller.
 * The returned residual is L−R. It finds at most one root and may reject a valid
 * equation when derivatives are flat, the initial guess is unsuitable, or a
 * discontinuity/domain prevents reliable convergence. No symbolic guarantees.
 */
function solve(expression, variable='x', initial=0, variables={}, options={}) {
  const parts=equationParts(expression), names=expressionVariables(expression);
  if(!VARIABLE_NAMES.has(variable)||!names.includes(variable)) fail('Variable ERROR');
  if(typeof initial!=='number'||!Number.isFinite(initial)) fail('Math ERROR');
  checkValues(names,variables,variable);
  const sample=x=>sides(parts,{...variables,[variable]:x},options);
  let x=initial, current=sample(x);
  const residualSmall=v=>Math.abs(v.residual)<=1e-10*Math.max(1,Math.abs(v.left),Math.abs(v.right));
  if(current.residual===0)return {root:x,residual:0,iterations:0};
  for(let iteration=1;iteration<=80;iteration++) {
    const h=Math.cbrt(Number.EPSILON)*Math.max(1,Math.abs(x));
    let left,right;try{left=sample(x-h)}catch{}try{right=sample(x+h)}catch{}
    let slope;
    if(left&&right)slope=(right.residual-left.residual)/(2*h);
    else if(right)slope=(right.residual-current.residual)/h;
    else if(left)slope=(current.residual-left.residual)/h;
    if(!Number.isFinite(slope)||slope===0)fail('Cannot Solve');
    let step=current.residual/slope;
    if(!Number.isFinite(step))fail('Cannot Solve');
    let candidate,next;
    // Backtrack only to remain inside the domain and reduce the residual.
    for(let j=0;j<24;j++) {
      candidate=x-step;
      if(Number.isFinite(candidate)&&candidate!==x)try{next=sample(candidate)}catch{}
      if(next&&Math.abs(next.residual)<=Math.abs(current.residual))break;
      next=undefined;step/=2;
    }
    if(!next) {
      if(residualSmall(current)&&Math.abs(step)<=1e-10*Math.max(1,Math.abs(x)))return {root:x,residual:current.residual,iterations:iteration};
      fail('Cannot Solve');
    }
    x=candidate;current=next;
    if(current.residual===0 || (residualSmall(current)&&Math.abs(step)<=1e-10*Math.max(1,Math.abs(x)))) return {root:x,residual:current.residual,iterations:iteration};
  }
  fail('Cannot Solve');
}

exports.expressionVariables=expressionVariables;
exports.calculate=calculate;
exports.solve=solve;
},
"spreadsheet.js":(exports,require)=>{
/** Small 5-by-45 spreadsheet model. Pure data model; no DOM. */
const {evaluate}=require("engine.js");
const CELL=/^([A-E])(\d+)$/;
const REF=/(?<![A-Za-z0-9_])(\$?)([A-E])(\$?)(\d+)(?![A-Za-z0-9_])/gi;
function coordinate(address) {
  const m=String(address).toUpperCase().match(CELL);
  if(!m||Number(m[2])<1||Number(m[2])>45) throw Error('Invalid cell');
  return {col:m[1].charCodeAt(0)-65,row:Number(m[2])};
}
function address(col,row) {if(col<0||col>4||row<1||row>45)throw Error('Invalid cell');return String.fromCharCode(65+col)+row;}
function references(a,b) {
  const x=coordinate(a), y=coordinate(b), cells=[];
  for(let row=Math.min(x.row,y.row);row<=Math.max(x.row,y.row);row++)
    for(let col=Math.min(x.col,y.col);col<=Math.max(x.col,y.col);col++)cells.push(address(col,row));
  return cells;
}
class Spreadsheet {
  constructor(options={}) {this.cells=new Map();this.options=options;}
  set(cell,content) {
    cell=cell.toUpperCase();coordinate(cell); const raw=String(content).trim();
    if(raw==='') this.cells.delete(cell); else this.cells.set(cell,raw);
  }
  get(cell) {cell=cell.toUpperCase();coordinate(cell);return this.cells.get(cell)??'';}
  clear(cell) {this.set(cell,'');}
  value(cell) {return this.#resolve(String(cell).toUpperCase(),new Set());}
  #resolve(cell,active) {
    coordinate(cell); if(active.has(cell))throw Error('Circular reference');
    const raw=this.get(cell); if(!raw)return 0;
    active.add(cell);
    try {
      if(!raw.startsWith('=')) {const v=Number(raw);if(!Number.isFinite(v))throw Error('Syntax ERROR');return v;}
      let expr=raw.slice(1);
      expr=expr.replace(/\b(SUM|MEAN)\s*\(\s*\$?([A-E])\$?(\d+)\s*:\s*\$?([A-E])\$?(\d+)\s*\)/gi,(_,op,c1,r1,c2,r2)=>{
        const list=references(c1.toUpperCase()+r1,c2.toUpperCase()+r2).map(c=>this.#resolve(c,active));
        const total=list.reduce((a,b)=>a+b,0);return `(${op.toUpperCase()==='MEAN'?total/list.length:total})`;
      });
      expr=expr.replace(REF,(_,absCol,col,absRow,row)=>`(${this.#resolve(col.toUpperCase()+row,active)})`);
      return evaluate(expr,this.options);
    } finally {active.delete(cell);}
  }
  /** Serializable raw entries, preserving formulas rather than their displayed values. */
  snapshot() { return {version:1,cells:Object.fromEntries(this.cells)}; }
  static fromSnapshot(snapshot,options={}) {
    if (!snapshot || typeof snapshot!=='object' || Array.isArray(snapshot) || snapshot.version!==1 || !snapshot.cells || typeof snapshot.cells!=='object' || Array.isArray(snapshot.cells)) throw Error('Invalid spreadsheet snapshot');
    const entries=Object.entries(snapshot.cells);
    if(entries.length>225)throw Error('Invalid spreadsheet snapshot');
    const result=new Spreadsheet(options);
    for(const [cell,raw] of entries){
      if(typeof raw!=='string'||raw.length>10000||cell!==cell.toUpperCase())throw Error('Invalid spreadsheet snapshot');
      coordinate(cell);result.set(cell,raw);
    }
    return result;
  }
  /** Copy a cell, adjusting relative references; $ anchors column or row. */
  copy(from,to) {
    from=from.toUpperCase();to=to.toUpperCase();const f=coordinate(from),t=coordinate(to);
    const raw=this.get(from);
    const shifted=raw.startsWith('=')?raw.replace(REF,(_,absCol,col,absRow,row)=>{
      const x=coordinate(col.toUpperCase()+row);
      return absCol+address(x.col+(absCol?0:t.col-f.col),x.row+(absRow?0:t.row-f.row)).replace(/^(\w)(\d+)$/,(_,c,r)=>c+absRow+r);
    }):raw;
    this.set(to,shifted);
  }
  /** Move literal content; dependent formulas elsewhere are not rewritten. */
  move(from,to) {from=from.toUpperCase();to=to.toUpperCase();coordinate(from);coordinate(to);if(from===to)return;const raw=this.get(from);this.set(to,raw);this.clear(from);}
  /** Fill a rectangular range by copying the top-left cell, adjusting references. */
  fill(from,to) {const cells=references(from,to);const source=cells[0];for(const c of cells.slice(1))this.copy(source,c);}
}

const SPREADSHEET_STORAGE_KEY='fx991lax.spreadsheet.v1';
/** On corrupt input, leave the original storage untouched and block automatic replacement. */
function loadSpreadsheet(storage, options={}) {
  if(!storage)return {sheet:new Spreadsheet(options),blocked:false,error:'Armazenamento indisponível. A planilha não será salva neste dispositivo.'};
  try {
    const raw=storage.getItem(SPREADSHEET_STORAGE_KEY);
    if(raw===null)return {sheet:new Spreadsheet(options),blocked:false,error:null};
    try{return {sheet:Spreadsheet.fromSnapshot(JSON.parse(raw),options),blocked:false,error:null};}
    catch{return {sheet:new Spreadsheet(options),blocked:true,error:'Dados salvos inválidos. Eles foram preservados; a gravação automática está suspensa.'};}
  } catch {return {sheet:new Spreadsheet(options),blocked:true,error:'Não foi possível ler a planilha salva. Verifique o armazenamento do navegador.'};}
}
function saveSpreadsheet(storage,sheet) {
  if(!storage)return false;
  try {storage.setItem(SPREADSHEET_STORAGE_KEY,JSON.stringify(sheet.snapshot()));return true;} catch{return false;}
}

exports.Spreadsheet=Spreadsheet;
exports.SPREADSHEET_STORAGE_KEY=SPREADSHEET_STORAGE_KEY;
exports.loadSpreadsheet=loadSpreadsheet;
exports.saveSpreadsheet=saveSpreadsheet;
},
"catalog.js":(exports,require)=>{
/** CONST/CONV: fx-991LA X guide (pp. 38–39,46) and NIST CODATA 2010. */
const C = (category,id,symbol,label,value,unit='') => Object.freeze({category,id,symbol,label,value,unit});
const CONSTANTS=Object.freeze([
 C('Universal','h','h','Constante de Planck',6.62606957e-34,'J s'),
 C('Universal','hbar','ℏ','Constante de Planck reduzida',1.054571726e-34,'J s'),
 C('Universal','c0','c₀','Velocidade da luz',299792458,'m/s'),
 C('Universal','epsilon0','ε₀','Permissividade do vácuo',1/(4e-7*Math.PI*299792458**2),'F/m'),
 C('Universal','mu0','μ₀','Permeabilidade do vácuo',4e-7*Math.PI,'N/A²'),
 C('Universal','Z0','Z₀','Impedância do vácuo',4e-7*Math.PI*299792458,'Ω'),
 C('Universal','G','G','Constante gravitacional',6.67384e-11,'m³/(kg s²)'),
 C('Universal','lP','lₚ','Comprimento de Planck',1.616199e-35,'m'),
 C('Universal','tP','tₚ','Tempo de Planck',5.39106e-44,'s'),
 C('Eletromagnético','muN','μN','Magneton nuclear',5.05078353e-27,'J/T'),
 C('Eletromagnético','muB','μB','Magneton de Bohr',9.27400968e-24,'J/T'),
 C('Eletromagnético','e','e','Carga elementar',1.602176565e-19,'C'),
 C('Eletromagnético','phi0','Φ₀','Quantum de fluxo magnético',2.067833758e-15,'Wb'),
 C('Eletromagnético','G0','G₀','Quantum de condutância',7.7480917346e-5,'S'),
 C('Eletromagnético','KJ','KJ','Constante de Josephson',483597.870e9,'Hz/V'),
 C('Eletromagnético','RK','RK','Constante de von Klitzing',25812.8074434,'Ω'),
 C('Atômico e nuclear','mp','mₚ','Massa do próton',1.672621777e-27,'kg'),
 C('Atômico e nuclear','mn','mₙ','Massa do nêutron',1.674927351e-27,'kg'),
 C('Atômico e nuclear','me','mₑ','Massa do elétron',9.10938291e-31,'kg'),
 C('Atômico e nuclear','mmu','mμ','Massa do múon',1.883531475e-28,'kg'),
 C('Atômico e nuclear','a0','a₀','Raio de Bohr',0.52917721092e-10,'m'),
 C('Atômico e nuclear','alpha','α','Constante de estrutura fina',7.2973525698e-3),
 C('Atômico e nuclear','re','rₑ','Raio clássico do elétron',2.8179403267e-15,'m'),
 C('Atômico e nuclear','lambdaC','λC','Comprimento de onda Compton',2.4263102389e-12,'m'),
 C('Atômico e nuclear','gammap','γₚ','Razão giromagnética do próton',2.675222005e8,'s⁻¹ T⁻¹'),
 C('Atômico e nuclear','lambdaCp','λCp','Compton do próton',1.32140985623e-15,'m'),
 C('Atômico e nuclear','lambdaCn','λCn','Compton do nêutron',1.3195909068e-15,'m'),
 C('Atômico e nuclear','Rinf','R∞','Constante de Rydberg',10973731.568539,'m⁻¹'),
 C('Atômico e nuclear','mup','μₚ','Momento magnético do próton',1.410606743e-26,'J/T'),
 C('Atômico e nuclear','mue','μₑ','Momento magnético do elétron',-9.28476430e-24,'J/T'),
 C('Atômico e nuclear','mun','μₙ','Momento magnético do nêutron',-0.96623647e-26,'J/T'),
 C('Atômico e nuclear','mumu','μμ','Momento magnético do múon',-4.49044807e-26,'J/T'),
 C('Atômico e nuclear','mtau','mτ','Massa do tau',3.16747e-27,'kg'),
 C('Físico-químico','u','u','Constante de massa atômica',1.660538921e-27,'kg'),
 C('Físico-químico','F','F','Constante de Faraday',96485.3365,'C/mol'),
 C('Físico-químico','NA','NA','Constante de Avogadro',6.02214129e23,'mol⁻¹'),
 C('Físico-químico','k','k','Constante de Boltzmann',1.3806488e-23,'J/K'),
 C('Físico-químico','Vm','Vm','Volume molar de gás ideal (100 kPa)',22.710953e-3,'m³/mol'),
 C('Físico-químico','R','R','Constante molar dos gases',8.3144621,'J/(mol K)'),
 C('Físico-químico','c1','c₁','Primeira constante de radiação',3.74177153e-16,'W m²'),
 C('Físico-químico','c2','c₂','Segunda constante de radiação',1.4387770e-2,'m K'),
 C('Físico-químico','sigma','σ','Constante de Stefan-Boltzmann',5.670373e-8,'W/(m² K⁴)'),
 C('Valores adotados','g','g','Aceleração padrão da gravidade',9.80665,'m/s²'),
 C('Valores adotados','atm','atm','Atmosfera padrão',101325,'Pa'),
 C('Valores adotados','RK90','RK-90','Valor convencional de von Klitzing',25812.807,'Ω'),
 C('Valores adotados','KJ90','KJ-90','Valor convencional de Josephson',483597.9e9,'Hz/V'),
 C('Outros','t','t','Conversão Celsius–Kelvin',273.15,'K')
]);
const conversions=[];
function pair(category,id,from,to,factor,forwardOffset=0,reverseOffset=0){
 conversions.push(Object.freeze({category,id:id+'-forward',label:`${from} → ${to}`,from,to,factor,offset:forwardOffset}));
 conversions.push(Object.freeze({category,id:id+'-reverse',label:`${to} → ${from}`,from:to,to:from,factor:1/factor,offset:reverseOffset}));
}
pair('Comprimento','in-cm','in','cm',2.54);
pair('Comprimento','ft-m','ft','m',0.3048);
pair('Comprimento','yd-m','yd','m',0.9144);
pair('Comprimento','mile-km','mile','km',1.609344);
pair('Comprimento','nmi-m','n mile','m',1852);
// NIST SP 811 (2008), tabela B.8: valor aproximado de parsec.
pair('Comprimento','pc-km','pc','km',3.085678e13);
pair('Área','acre-m2','acre (survey)','m²',4046.873);
pair('Volume','gal-us-l','gal (US)','L',3.785411784);
pair('Volume','gal-uk-l','gal (UK)','L',4.54609);
pair('Massa','oz-g','oz','g',28.349523125);
pair('Massa','lb-kg','lb','kg',0.45359237);
pair('Velocidade','kmh-ms','km/h','m/s',1/3.6);
pair('Pressão','atm-pa','atm','Pa',101325);
pair('Pressão','mmhg-pa','mmHg','Pa',133.3224);
pair('Pressão','kgfcm2-pa','kgf/cm²','Pa',98066.5);
pair('Pressão','lbf-in2-kpa','lbf/in²','kPa',6.894757293168361);
pair('Energia','kgfm-j','kgf m','J',9.80665);
pair('Energia','j-cal15','J','cal (15 °C)',1/4.1858);
pair('Potência','hp-kw','hp','kW',0.7456998715822702);
pair('Temperatura','f-c','°F','°C',5/9,-160/9,32);
const CONVERSIONS=Object.freeze(conversions);
function getConstant(id){const c=CONSTANTS.find(x=>x.id===String(id));if(!c)throw Error('Constante inválida');return c}
function convert(id,value){const c=CONVERSIONS.find(x=>x.id===String(id));if(!c)throw Error('Conversão inválida');if(typeof value!=='number'||!Number.isFinite(value))throw Error('Math ERROR');const n=value*c.factor+c.offset;if(!Number.isFinite(n))throw Error('Math ERROR');return Object.is(n,-0)?0:n}

exports.CONSTANTS=CONSTANTS;
exports.CONVERSIONS=CONVERSIONS;
exports.getConstant=getConstant;
exports.convert=convert;
},
"settings.js":(exports,require)=>{
/** Independent display settings for the scientific calculator. */
const SETTINGS_KEY = 'fx991lax.settings.v1';
const DEFAULT_SETTINGS = Object.freeze({ angle: 'DEG', format: 'NORM', digits: 1 });
const angles = ['DEG','RAD','GRAD'];
const formats = ['FIX','SCI','NORM'];

function validateSettings(value) {
  if (!value || !angles.includes(value.angle) || !formats.includes(value.format) ||
      !Number.isInteger(value.digits) || (value.format === 'NORM' ? ![1,2].includes(value.digits) : value.digits < 0 || value.digits > 9)) {
    throw Error('Configuração inválida');
  }
  return { angle:value.angle, format:value.format, digits:value.digits };
}

/** Never overwrites invalid stored data until the user explicitly saves or resets. */
function createSettings(storage) {
  let current = {...DEFAULT_SETTINGS}, warning = '';
  try { if (storage===undefined) storage=globalThis.localStorage; const raw = storage?.getItem(SETTINGS_KEY); if (raw !== null && raw !== undefined) current=validateSettings(JSON.parse(raw)); }
  catch { warning='Não foi possível ler a configuração salva.'; }
  function write(next) {
    current=validateSettings(next); warning='';
    try { if (!storage) throw Error(); storage.setItem(SETTINGS_KEY,JSON.stringify(current)); }
    catch { warning='Não foi possível salvar a configuração; ela vale apenas nesta sessão.'; }
    return { settings:{...current}, warning };
  }
  return {
    get:()=>({...current}), getWarning:()=>warning,
    set:write, reset:()=>write({...DEFAULT_SETTINGS})
  };
}

/** Decimal output only; exact output may be displayed separately. */
function formatNumber(value, settings=DEFAULT_SETTINGS) {
  const {format,digits}=validateSettings(settings);
  if (!Number.isFinite(value)) throw Error('Math ERROR');
  if (Object.is(value,-0)) value=0;
  const exponent=(number,decimalPlaces)=>number.toExponential(decimalPlaces)
    .replace(/e\+?(-?)0*(\d+)/,'×10^$1$2');
  if (format==='SCI') return exponent(value,(digits===0?10:digits)-1);
  if (format==='FIX') return Math.abs(value)>=1e10 ? exponent(value,9) : value.toFixed(digits);
  const n=Math.abs(value), threshold=digits===1?1e-2:1e-9;
  if (n!==0 && (n<threshold || n>=1e10)) return exponent(Number(value.toPrecision(10)),9).replace(/(\.\d*?)0+×/,'$1×').replace(/\.×/,'×');
  return String(Number(value.toPrecision(10)));
}

/** Staged setup form. onResetAll is invoked only after an explicit second click. */
function mountSetup(container, store, callbacks={}) {
  const initial=store.get();
  container.innerHTML='<section class="setup-ui" aria-label="Configuração"><form><label>Unidade angular <select name="angle"><option value="DEG">Graus (DEG)</option><option value="RAD">Radianos (RAD)</option><option value="GRAD">Grados (GRAD)</option></select></label><label>Formato <select name="format"><option value="NORM">Normal (NORM)</option><option value="FIX">Casas decimais (FIX)</option><option value="SCI">Algarismos significativos (SCI)</option></select></label><label><span data-digit-label>Norma</span> <select name="digits"></select></label><div><button type="submit">Aplicar</button> <button type="button" data-cancel>Cancelar</button></div><div><button type="button" data-reset>Restaurar configuração</button> <button type="button" data-reset-all>Apagar todos os dados</button></div><div data-confirm hidden><span>Apagar também dados e planilha?</span> <button type="button" data-confirm-reset>Confirmar</button> <button type="button" data-cancel-reset>Cancelar</button></div><output role="status" aria-live="polite"></output></form></section>';
  const form=container.querySelector('form'),angle=form.elements.angle,format=form.elements.format,digits=form.elements.digits,output=form.querySelector('output'),confirm=form.querySelector('[data-confirm]');
  angle.value=initial.angle;format.value=initial.format;
  function setDigits(value){const norm=format.value==='NORM';digits.replaceChildren();for(const n of norm?[1,2]:[0,1,2,3,4,5,6,7,8,9]){const o=document.createElement('option');o.value=String(n);o.textContent=norm?`Norm ${n}`:String(n)+(format.value==='SCI'&&n===0?' (10 algarismos)':'');digits.append(o)}digits.value=String(value);if(digits.selectedIndex<0)digits.selectedIndex=0;form.querySelector('[data-digit-label]').textContent=norm?'Norma':format.value==='FIX'?'Casas decimais':'Algarismos significativos';}
  setDigits(initial.digits);output.textContent=store.getWarning();
  format.addEventListener('change',()=>setDigits(format.value==='NORM'?1:format.value==='SCI'?9:2));
  form.addEventListener('submit',event=>{event.preventDefault();try{const result=store.set({angle:angle.value,format:format.value,digits:Number(digits.value)});output.textContent=result.warning;callbacks.onApply?.(result.settings,result.warning)}catch(e){output.textContent=e.message}});
  form.querySelector('[data-cancel]').addEventListener('click',()=>callbacks.onCancel?.());
  form.querySelector('[data-reset]').addEventListener('click',()=>{const result=store.reset();angle.value=result.settings.angle;format.value=result.settings.format;setDigits(result.settings.digits);output.textContent=result.warning;callbacks.onApply?.(result.settings,result.warning)});
  const resetAll=form.querySelector('[data-reset-all]');if(!callbacks.onResetAll)resetAll.hidden=true;
  resetAll.addEventListener('click',()=>{confirm.hidden=false;});form.querySelector('[data-cancel-reset]').addEventListener('click',()=>{confirm.hidden=true;});
  form.querySelector('[data-confirm-reset]').addEventListener('click',()=>{try{callbacks.onResetAll?.();const result=store.reset();output.textContent=result.warning;callbacks.onApply?.(result.settings,result.warning);confirm.hidden=true}catch(e){output.textContent=e.message}});
  return ()=>container.replaceChildren();
}

exports.SETTINGS_KEY=SETTINGS_KEY;
exports.DEFAULT_SETTINGS=DEFAULT_SETTINGS;
exports.validateSettings=validateSettings;
exports.createSettings=createSettings;
exports.formatNumber=formatNumber;
exports.mountSetup=mountSetup;
}};const cache={};function require(name){if(cache[name])return cache[name];if(!modules[name])throw Error('Missing module: '+name);const value={};cache[name]=value;modules[name](value,require);return value}const engine=require('engine.js'),exact=require('exact.js');globalThis.nativeCalculate=function(input){try{const expr=String(input.expression).replaceAll(',','.').replaceAll(';',',');const answer=engine.evaluate(expr,{angle:input.angle||'DEG',ans:input.ans||0,variables:input.variables||{},memory:input.memory||0});const config={angle:input.angle||'DEG',format:input.format||'NORM',digits:Number.isInteger(input.digits)?input.digits:1};const decimal=require('settings.js').formatNumber(answer,config);return JSON.stringify({ok:true,value:answer,decimal,exact:exact.exactResult(expr)})}catch(e){return JSON.stringify({ok:false,error:String(e.message||e)})}};globalThis.nativeAdvanced=function(input){try{const f=input.fields||[], num=i=>{const raw=String(f[i]??'').trim().replace(',','.');if(!raw)throw Error('Syntax ERROR');const x=Number(raw);if(!Number.isFinite(x))throw Error('Math ERROR');return x}, options={angle:input.angle||'DEG'}, m=require('modes.js'),l=require('linear.js'),st=require('statistics.js'),cal=require('calculus.js');let value,snapshot;switch(input.kind){
case 'Complexos':{const op=input.operation||'Somar';value=op==='Retangular → polar'?m.complexPolar(String(f[0]).replaceAll(',','.'),options.angle):op==='Polar → retangular'?m.complexFromPolar(num(0),num(1),options.angle):m.complexOperation(String(f[0]).replaceAll(',','.'),({Somar:'+',Subtrair:'-',Multiplicar:'*',Dividir:'/'})[op],String(f[1]).replaceAll(',','.'));break;}
case 'Base-N':{const op=input.operation||'Converter';value=op==='Converter'?m.baseConvert(f[0],num(1),num(2)):op==='NOT'?m.baseNot(f[0],num(1)):m.baseOperation(f[0],({Somar:'+',Subtrair:'-',Multiplicar:'*',Dividir:'/',AND:'and',OR:'or',XOR:'xor',XNOR:'xnor'})[op],f[1],num(2));break;}
case 'Matriz':{const op=input.operation||'Determinante',n=op.includes('3×3')?3:op.includes('4×4')?4:2;const mat=start=>Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>num(start+r*n+c)));const a=mat(0);if(op.startsWith('Determinante'))value=l.determinant(a);else if(op.startsWith('Inversa'))value=l.matrixInverse(a);else if(op.startsWith('Transposta'))value=l.matrixTranspose(a);else if(op.startsWith('Escalar por número'))value=l.matrixScale(a,num(n*n));else {const b=mat(n*n);value=op.startsWith('Somar')?l.matrixAdd(a,b):op.startsWith('Subtrair')?l.matrixSubtract(a,b):op.startsWith('Multiplicar')?l.matrixMultiply(a,b):(()=>{throw Error('Syntax ERROR')})()}break;}
case 'Vetor':{const op=input.operation||'Escalar',n=op.endsWith('2D')?2:3,name=op.replace(/ 2D$/,'');const a=Array.from({length:n},(_,i)=>num(i));if(name==='Norma')value=l.vectorNorm(a);else if(name==='Unitário')value=l.vectorUnit(a);else if(name==='Escalar por número')value=l.vectorScale(a,num(n));else{const b=Array.from({length:n},(_,i)=>num(n+i));if(name==='Escalar')value=l.vectorDot(a,b);else if(name==='Vetorial')value=l.vectorCross(a,b);else if(name==='Somar')value=l.vectorAdd(a,b);else if(name==='Subtrair')value=l.vectorSubtract(a,b);else if(name==='Ângulo')value=l.vectorAngle(a,b,options.angle);else throw Error('Syntax ERROR')}break;}
case 'Estatística':{const op=input.operation||'1 variável';if(op==='1 variável'){const data=f.map((raw,i)=>String(raw).trim()?[num(i)]:null).filter(Boolean);value=st.oneVariable(data)}else{const models={'Linear':'linear','Quadrática':'quadratic','Logarítmica':'logarithmic','Exponencial':'exponential','Potência':'power','Inversa':'inverse'};const model=models[op];if(!model)throw Error('Syntax ERROR');let rows=[];for(let i=0;i<f.length;i+=2){if(!String(f[i]||'').trim()&&!String(f[i+1]||'').trim())continue;rows.push([num(i),num(i+1)])}value=st.regression(rows,model)}break;}
case 'Distribuição':{const op=input.operation||'Normal CDF';if(op==='Normal CDF')value=st.normalCDF(num(0),num(1),num(2));else if(op==='Normal PDF')value=st.normalPDF(num(0),num(1),num(2));else if(op==='Normal inversa')value=st.inverseNormal(num(0),num(1),num(2));else if(op==='Binomial PDF')value=st.binomialPDF(num(0),num(1),num(2));else if(op==='Binomial CDF')value=st.binomialCDF(num(0),num(1),num(2));else if(op==='Poisson PDF')value=st.poissonPDF(num(0),num(1));else if(op==='Poisson CDF')value=st.poissonCDF(num(0),num(1));else throw Error('Syntax ERROR');break;}
case 'Tabela':{let two=input.operation==='Duas funções';value=m.makeTable(String(f[0]).replaceAll(',','.'),two?String(f[1]).replaceAll(',','.'):null,num(two?2:1),num(two?3:2),num(two?4:3),options);break;}
case 'Equação':{const op=input.operation||'Grau 2';if(op.startsWith('Sistema')){const n=Number(op.match(/[234]/)?.[0]);if(!n)throw Error('Syntax ERROR');const a=Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>num(r*(n+1)+c))),b=Array.from({length:n},(_,r)=>num(r*(n+1)+n));value=l.solveSystem(a,b)}else value=l.polynomialRoots(f.map((_,i)=>num(i)));break;}
case 'Desigualdade':{const op=input.operation||'>=',relation=op.split(' ').at(-1);value=m.solveInequality(f.map((_,i)=>num(i)),relation);break;}
case 'Δ%':{const initial=num(0),final=num(1);if(initial===0)throw Error('Math ERROR');value=(final-initial)/initial*100;if(!Number.isFinite(value))throw Error('Math ERROR');break;}
case 'Proporção':value=m.solveProportion(num(0),num(1),num(2),input.operation||'D');break;
case 'Integral':value=cal.integral(String(f[0]).replaceAll(',','.'),num(1),num(2),options);break;
case 'Derivada':value=cal.derivative(String(f[0]).replaceAll(',','.'),num(1),options);break;
case 'Somatório':value=cal.summation(String(f[0]).replaceAll(',','.'),num(1),num(2),options);break;
case 'CALC':value=require('solve.js').calculate(String(f[0]).replaceAll(',','.'),{x:num(1),A:num(2),B:num(3)},options);break;
case 'SOLVE':value=require('solve.js').solve(String(f[0]).replaceAll(',','.'),'x',num(1),{A:num(2),B:num(3)},options);break;
case 'DMS':{const sci=require('scientific.js');if(input.operation==='DMS → decimal'){const degrees=num(0);value=sci.fromDMS(Math.abs(degrees),num(1),num(2),degrees<0)}else value=sci.toDMS(num(0));break;}
case 'FATOR':value=require('scientific.js').primeFactors(num(0));break;
case 'ENG':value=require('scientific.js').engineering(num(0),num(1));break;
case 'CONV':value=require('catalog.js').convert(input.operation,num(0));break;
case 'Pol':value=require('scientific.js').polar(num(0),num(1),options.angle);break;
case 'Rec':value=require('scientific.js').rectangular(num(0),num(1),options.angle);break;
case 'PlanilhaAções':{const S=require('spreadsheet.js').Spreadsheet,sheet=input.snapshot?S.fromSnapshot(JSON.parse(input.snapshot),options):new S(options),from=String(f[0]||'').toUpperCase(),to=String(f[1]||'').toUpperCase();if(input.operation==='Copiar')sheet.copy(from,to);else if(input.operation==='Preencher'){const a=from.match(/^([A-E])(\d+)$/),b=to.match(/^([A-E])(\d+)$/);if(!a||!b||a[1]>b[1]||Number(a[2])>Number(b[2]))throw Error('Intervalo inválido');sheet.fill(from,to)}else throw Error('Syntax ERROR');value='OK';snapshot=JSON.stringify(sheet.snapshot());break;}
case 'PlanilhaVisualizar':{const S=require('spreadsheet.js').Spreadsheet,sheet=input.snapshot?S.fromSnapshot(JSON.parse(input.snapshot),options):new S(options);value={};for(const cell of Object.keys(sheet.snapshot().cells)){try{value[cell]=String(Number(sheet.value(cell).toPrecision(10))).replace('.',',')}catch{value[cell]='ERRO'}}break;}
case 'Planilha':{const S=require('spreadsheet.js').Spreadsheet;let sheet=input.snapshot?S.fromSnapshot(JSON.parse(input.snapshot),options):new S(options);let cell=String(f[0]||'').toUpperCase();sheet.set(cell,String(f[1]||'').replaceAll(',','.'));value=sheet.value(cell);snapshot=JSON.stringify(sheet.snapshot());break;}
default:throw Error('Modo não disponível');}const fmt=n=>typeof n==='number'?String(Number(n.toPrecision(10))).replace('.',','):String(n);let display;if(input.kind==='Complexos' && input.operation==='Retangular → polar')display='r='+fmt(value.radius)+'  θ='+fmt(value.angle);else if(input.kind==='Complexos')display=fmt(value.re)+(value.im<0?' − ':' + ')+fmt(Math.abs(value.im))+'i';else if(input.kind==='Estatística')display=(input.operation||'1 variável')==='1 variável'?'n='+fmt(value.n)+'  x̄='+fmt(value.mean)+'  σ='+fmt(value.populationSD):'a='+fmt(value.a)+'  b='+fmt(value.b)+(value.c!==undefined?'  c='+fmt(value.c):'')+(Number.isFinite(value.r)?'  r='+fmt(value.r):'');else if(input.kind==='Equação')display=value.map((z,i)=>'x'+(i+1)+'='+(typeof z==='number'?fmt(z):fmt(z.re)+(z.im?' '+(z.im<0?'−':'+')+' '+fmt(Math.abs(z.im))+'i':''))).join('  ');else if(input.kind==='DMS' && typeof value==='object')display=(value.negative?'−':'')+fmt(value.degrees)+'° '+fmt(value.minutes)+'′ '+fmt(value.seconds)+'″';else if(input.kind==='FATOR')display=value.map(x=>fmt(x.prime)+(x.exponent>1?'^'+fmt(x.exponent):'')).join(' × ');else if(input.kind==='ENG')display=fmt(value.mantissa)+'×10^'+fmt(value.exponent);else if(input.kind==='SOLVE')display='x='+fmt(value.root)+'  L−R='+fmt(value.residual);else if(input.kind==='Pol')display='r='+fmt(value.radius)+'  θ='+fmt(value.angle);else if(input.kind==='Rec')display='x='+fmt(value.x)+'  y='+fmt(value.y);else if(input.kind==='Tabela')display=value.map(row=>fmt(row.x)+': '+row.values.map(fmt).join(' ')).join('  |  ');else if(input.kind==='Desigualdade')display=value.map(x=>(x.lowerInclusive?'[':'(')+(x.lower===null?'−∞':fmt(x.lower))+';'+(x.upper===null?'∞':fmt(x.upper))+(x.upperInclusive?']':')')).join(' ∪ ')||'∅';else if(Array.isArray(value))display=value.map(x=>Array.isArray(x)?x.map(fmt).join('  '):fmt(x)).join(' | ');else display=fmt(value);return JSON.stringify({ok:true,result:JSON.stringify(value),display,snapshot})}catch(e){return JSON.stringify({ok:false,error:String(e.message||e)})}}})();
