/** Real-number expression evaluator; no dynamic code execution. */
export function evaluate(expression, options = {}) {
  const source = String(expression).replace(/[π×÷−√]/g, c => ({'π':'pi','×':'*','÷':'/','−':'-','√':'sqrt'}[c]));
  const tokens = []; let i = 0;
  while (i < source.length) {
    if (/\s/.test(source[i])) { i++; continue; }
    const rest = source.slice(i);
    const n = rest.match(/^(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?/);
    if (n) { tokens.push({type:'number', value:Number(n[0])}); i += n[0].length; continue; }
    const w = rest.match(/^[a-zA-Z]+/);
    if (w) { tokens.push({type:'word', value:w[0]}); i += w[0].length; continue; }
    if ('+-*/^()!%,'.includes(source[i])) { tokens.push({type:source[i++]}); continue; }
    throw Error('Syntax ERROR');
  }
  tokens.push({type:'end'}); let pos = 0;
  const peek = () => tokens[pos];
  const take = type => { if (peek().type !== type) throw Error('Syntax ERROR'); return tokens[pos++]; };
  const checked = n => { if (!Number.isFinite(n)) throw Error('Math ERROR'); return Object.is(n,-0) ? 0 : n; };
  const rad = n => options.angle === 'RAD' ? n : n * Math.PI / 180;
  const angle = n => options.angle === 'RAD' ? n : n * 180 / Math.PI;
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
    logbase:(base,n)=>Math.log(n)/Math.log(base),
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
        const arity = ['logbase','npr','ncr'].includes(name) ? 2 : 1;
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

export function formatResult(value) {
  if (!Number.isFinite(value)) throw Error('Math ERROR');
  if (value === 0) return '0';
  return Number(value.toPrecision(10)).toString().replace('e+', '×10^').replace('e-', '×10^-');
}
