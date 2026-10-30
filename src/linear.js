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
export function matrixAdd(a,b) { same(a,b); return a.map((r,i)=>r.map((v,j)=>v+b[i][j])); }
export function matrixSubtract(a,b) { same(a,b); return a.map((r,i)=>r.map((v,j)=>v-b[i][j])); }
export function matrixScale(a,s) { shape(a); number(s); return a.map(r=>r.map(v=>v*s)); }
export function matrixMultiply(a,b) { const [m,n]=shape(a),[p,q]=shape(b); if(n!==p) fail('Dimension ERROR'); return Array.from({length:m},(_,i)=>Array.from({length:q},(_,j)=>a[i].reduce((sum,v,k)=>sum+v*b[k][j],0))); }
export function matrixTranspose(a) { const [m,n]=shape(a); return Array.from({length:n},(_,j)=>Array.from({length:m},(_,i)=>a[i][j])); }
export function matrixIdentity(n) { if (!Number.isInteger(n)||n<1||n>4) fail('Dimension ERROR'); return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>+(i===j))); }
function square(a) { const [n,m]=shape(a); if(n!==m) fail('Dimension ERROR'); return n; }
// Scaled partial pivoting guards against false singularity on small matrices.
function pivotRow(a,k) { let best=-1,idx=k; for(let i=k;i<a.length;i++){ const scale=Math.max(...a[i].slice(0,a.length).map(Math.abs)); const ratio=scale?Math.abs(a[i][k])/scale:0; if(ratio>best){best=ratio;idx=i;} } return [idx,best]; }
export function determinant(a) {
  const n=square(a), w=a.map(r=>r.slice()); let sign=1, result=1;
  for(let k=0;k<n;k++) { const [p,ratio]=pivotRow(w,k); if(ratio<EPS) return 0; if(p!==k){[w[p],w[k]]=[w[k],w[p]];sign=-sign;} const v=w[k][k];result*=v; for(let i=k+1;i<n;i++){const f=w[i][k]/v;for(let j=k+1;j<n;j++)w[i][j]-=f*w[k][j];w[i][k]=0;} }
  return sign*result;
}
export function solveSystem(a,b) {
  const n=square(a); if(!Array.isArray(b)||b.length!==n) fail('Dimension ERROR'); b.forEach(number);
  const w=a.map((r,i)=>[...r,b[i]]);
  for(let k=0;k<n;k++){const [p,ratio]=pivotRow(w,k);if(ratio<EPS) fail('Singular matrix');if(p!==k)[w[p],w[k]]=[w[k],w[p]];for(let i=k+1;i<n;i++){const f=w[i][k]/w[k][k];for(let j=k;j<=n;j++)w[i][j]-=f*w[k][j];}}
  const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let v=w[i][n];for(let j=i+1;j<n;j++)v-=w[i][j]*x[j];x[i]=v/w[i][i];if(!Number.isFinite(x[i]))fail();}return x;
}
export function matrixInverse(a) { const n=square(a), columns=matrixIdentity(n).map(row=>solveSystem(a,row)); return matrixTranspose(columns); }
function vec(v) {if(!Array.isArray(v)||![2,3].includes(v.length))fail('Dimension ERROR');v.forEach(number);return v.length;}
function pair(a,b) {if(vec(a)!==vec(b))fail('Dimension ERROR');}
export function vectorAdd(a,b){pair(a,b);return a.map((x,i)=>x+b[i]);}
export function vectorSubtract(a,b){pair(a,b);return a.map((x,i)=>x-b[i]);}
export function vectorScale(a,s){vec(a);number(s);return a.map(x=>x*s);}
export function vectorDot(a,b){pair(a,b);return a.reduce((sum,x,i)=>sum+x*b[i],0);}
export function vectorCross(a,b){pair(a,b);if(a.length!==3)fail('Dimension ERROR');return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
export function vectorNorm(a){vec(a);return Math.hypot(...a);}
export function vectorUnit(a){const n=vectorNorm(a);if(n===0)fail();return a.map(v=>v/n);}
export function vectorAngle(a,b,angle='DEG'){pair(a,b);const n=vectorNorm(a)*vectorNorm(b);if(n===0)fail();const value=Math.acos(Math.max(-1,Math.min(1,vectorDot(a,b)/n)));if(!['DEG','RAD'].includes(angle))fail();return angle==='DEG'?value*180/Math.PI:value;}

// Roots are complex {re, im}; quadratic uses a stable formula. Cubic/quartic
// use Durand–Kerner with a convergence/residual check, so failure is explicit.
const add=(a,b)=>({re:a.re+b.re,im:a.im+b.im}), sub=(a,b)=>({re:a.re-b.re,im:a.im-b.im});
const mul=(a,b)=>({re:a.re*b.re-a.im*b.im,im:a.re*b.im+a.im*b.re});
const div=(a,b)=>{const d=b.re*b.re+b.im*b.im;if(d===0)fail('Root solver did not converge');return {re:(a.re*b.re+a.im*b.im)/d,im:(a.im*b.re-a.re*b.im)/d};};
const abs=z=>Math.hypot(z.re,z.im);
function poly(coeff,z){return coeff.reduce((v,c)=>add(mul(v,z),{re:c,im:0}),{re:0,im:0});}
export function polynomialRoots(coefficients) {
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
