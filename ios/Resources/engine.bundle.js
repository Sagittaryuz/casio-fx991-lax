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
}};const cache={};function require(name){if(cache[name])return cache[name];if(!modules[name])throw Error('Missing module: '+name);const value={};cache[name]=value;modules[name](value,require);return value}const engine=require('engine.js'),exact=require('exact.js');globalThis.nativeCalculate=function(input){try{const expr=String(input.expression).replaceAll(',','.').replaceAll(';',',');const answer=engine.evaluate(expr,{angle:input.angle||'DEG',ans:input.ans||0,variables:input.variables||{},memory:input.memory||0});return JSON.stringify({ok:true,value:answer,decimal:engine.formatResult(answer),exact:exact.exactResult(expr)})}catch(e){return JSON.stringify({ok:false,error:String(e.message||e)})}}})();
