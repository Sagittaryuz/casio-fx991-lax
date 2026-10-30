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
export function exactResult(expression){try{
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
