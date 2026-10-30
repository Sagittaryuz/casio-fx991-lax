import { evaluate } from './engine.js';

const fail = () => { throw Error('Math ERROR'); };
function real(n) { if (typeof n !== 'number' || !Number.isFinite(n)) fail(); return n; }
function value(expression, x, options) { return real(evaluate(expression, { ...options, variables: { ...options.variables, x } })); }

/** Central difference with Richardson refinement. Numeric approximation, not symbolic. */
export function derivative(expression, x, options = {}) {
  real(x);
  const h = Math.cbrt(Number.EPSILON) * Math.max(1, Math.abs(x));
  const d1 = (value(expression, x+h, options) - value(expression, x-h, options)) / (2*h);
  const d2 = (value(expression, x+h/2, options) - value(expression, x-h/2, options)) / h;
  const result = (4*d2-d1)/3;
  if (Math.abs(d2-d1) > 1e-4 * Math.max(1, Math.abs(result))) fail();
  return real(result);
}

/** Adaptive Simpson quadrature, limited to finite intervals and bounded work. */
export function integral(expression, a, b, options = {}) {
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
export function summation(expression, from, to, options = {}) {
  if (!Number.isSafeInteger(from) || !Number.isSafeInteger(to) || to < from || to-from > 99999) fail();
  let sum=0, compensation=0;
  for (let x=from; x<=to; x++) {
    const y=value(expression,x,options)-compensation;
    const next=sum+y; compensation=(next-sum)-y; sum=next;
  }
  return real(sum);
}
