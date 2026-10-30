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
export function oneVariable(data){
 const r=rows(data);const n=r.reduce((s,a)=>s+a.f,0);if(n>Number.MAX_SAFE_INTEGER)err();
 const sum=r.reduce((s,a)=>s+a.x*a.f,0), sumSquares=r.reduce((s,a)=>s+a.x*a.x*a.f,0),mean=sum/n;
 const ss=r.reduce((s,a)=>s+a.f*(a.x-mean)**2,0);const sorted=r.filter(a=>a.f).sort((a,b)=>a.x-b.x);
 let half=Math.floor(n/2); return {n,sum,sumSquares,mean,populationSD:Math.sqrt(ss/n),sampleSD:n>1?Math.sqrt(ss/(n-1)):NaN,min:sorted[0].x,q1:medianAt(sorted,0,half),median:medianAt(sorted,0,n),q3:medianAt(sorted,n-half,half),max:sorted.at(-1).x};
}
export function twoVariable(data){
 const r=rows(data,true), n=r.reduce((s,a)=>s+a.f,0), sx=r.reduce((s,a)=>s+a.x*a.f,0),sy=r.reduce((s,a)=>s+a.y*a.f,0),sxx=r.reduce((s,a)=>s+a.x*a.x*a.f,0),syy=r.reduce((s,a)=>s+a.y*a.y*a.f,0),sxy=r.reduce((s,a)=>s+a.x*a.y*a.f,0);
 const ssx=r.reduce((s,a)=>s+a.f*(a.x-sx/n)**2,0), ssy=r.reduce((s,a)=>s+a.f*(a.y-sy/n)**2,0);
 return {n,sumX:sx,sumY:sy,sumX2:sxx,sumY2:syy,sumXY:sxy,meanX:sx/n,meanY:sy/n,populationSDX:Math.sqrt(ssx/n),populationSDY:Math.sqrt(ssy/n),sampleSDX:n>1?Math.sqrt(ssx/(n-1)):NaN,sampleSDY:n>1?Math.sqrt(ssy/(n-1)):NaN};
}
function solve3(m,b){m=m.map((row,i)=>[...row,b[i]]);for(let k=0;k<3;k++){let p=k;for(let i=k+1;i<3;i++)if(Math.abs(m[i][k])>Math.abs(m[p][k]))p=i;[m[k],m[p]]=[m[p],m[k]];if(Math.abs(m[k][k])<1e-14)err();let x=m[k][k];for(let j=k;j<4;j++)m[k][j]/=x;for(let i=0;i<3;i++)if(i!==k){x=m[i][k];for(let j=k;j<4;j++)m[i][j]-=x*m[k][j]}}return m.map(row=>row[3])}
/** Models: linear, quadratic, logarithmic, exponential, power, inverse.
 * Returns a,b,c,r where relevant and predict(x). */
export function regression(data,model='linear'){
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
export function normalPDF(x,mu=0,sigma=1){validNormal(mu,sigma);if(!finite(x))err();let z=(x-mu)/sigma;return Math.exp(-z*z/2)/(sigma*Math.sqrt(2*Math.PI))}
export function normalCDF(x,mu=0,sigma=1){validNormal(mu,sigma);if(x===Infinity)return 1;if(x===-Infinity)return 0;if(!finite(x))err();return (1+erf((x-mu)/(sigma*Math.SQRT2)))/2}
export function normalInterval(lower,upper,mu=0,sigma=1){if(lower>upper)err();return normalCDF(upper,mu,sigma)-normalCDF(lower,mu,sigma)}
// Acklam's inverse normal approximation, followed by Newton refinement.
export function inverseNormal(p,mu=0,sigma=1){validNormal(mu,sigma);if(!finite(p)||p<=0||p>=1)err();
 const a=[-39.69683028665376,220.9460984245205,-275.9285104469687,138.357751867269,-30.66479806614716,2.506628277459239],b=[-54.47609879822406,161.5858368580409,-155.6989798598866,66.80131188771972,-13.28068155288572],c=[-.007784894002430293,-.3223964580411365,-2.400758277161838,-2.549732539343734,4.374664141464968,2.938163982698783],d=[.007784695709041462,.3224671290700398,2.445134137142996,3.754408661907416];
 let q,x;if(p<.02425){q=Math.sqrt(-2*Math.log(p));x=(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}else if(p>1-.02425){q=Math.sqrt(-2*Math.log(1-p));x=-(((((c[0]*q+c[1])*q+c[2])*q+c[3])*q+c[4])*q+c[5])/((((d[0]*q+d[1])*q+d[2])*q+d[3])*q+1)}else{q=p-.5;let z=q*q;x=(((((a[0]*z+a[1])*z+a[2])*z+a[3])*z+a[4])*z+a[5])*q/(((((b[0]*z+b[1])*z+b[2])*z+b[3])*z+b[4])*z+1)}return mu+sigma*x;
}
const logFactorials=[0];
function logFactorial(n){if(n>10000)err();for(let i=logFactorials.length;i<=n;i++)logFactorials[i]=logFactorials[i-1]+Math.log(i);return logFactorials[n]}
function validBinomial(n,p){if(!Number.isSafeInteger(n)||n<0||n>10000||!finite(p)||p<0||p>1)err()}
export function binomialPDF(x,n,p){validBinomial(n,p);if(!Number.isSafeInteger(x))err();if(x<0||x>n)return 0;if(p===0)return x===0?1:0;if(p===1)return x===n?1:0;return Math.exp(logFactorial(n)-logFactorial(x)-logFactorial(n-x)+x*Math.log(p)+(n-x)*Math.log1p(-p))}
export function binomialCDF(x,n,p){validBinomial(n,p);if(!Number.isSafeInteger(x))err();if(x<0)return 0;if(x>=n)return 1;let s=0;for(let k=0;k<=x;k++)s+=binomialPDF(k,n,p);return Math.min(1,s)}
function validPoisson(lambda){if(!finite(lambda)||lambda<0||lambda>10000)err()}
export function poissonPDF(x,lambda){validPoisson(lambda);if(!Number.isSafeInteger(x))err();if(x<0)return 0;if(lambda===0)return x===0?1:0;return Math.exp(-lambda+x*Math.log(lambda)-logFactorial(x))}
export function poissonCDF(x,lambda){validPoisson(lambda);if(!Number.isSafeInteger(x))err();if(x<0)return 0;if(x>10000)err();let s=0;for(let k=0;k<=x;k++)s+=poissonPDF(k,lambda);return Math.min(1,s)}
