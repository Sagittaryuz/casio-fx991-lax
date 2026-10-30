/** Scientific helpers, independent of the UI and proprietary firmware. */
const fail=()=>{throw Error('Math ERROR')};
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const checked=n=>{if(!finite(n))fail();return Object.is(n,-0)?0:n};
function angleFactor(unit){if(unit==='DEG')return Math.PI/180;if(unit==='RAD')return 1;if(unit==='GRAD')return Math.PI/200;fail()}

/** Convert decimal degrees to signed DMS. Seconds retain up to 9 decimal places. */
export function toDMS(value){
 if(!finite(value))fail();const negative=value<0||Object.is(value,-0);let absolute=Math.abs(value);
 let degrees=Math.floor(absolute);let rem=(absolute-degrees)*60;let minutes=Math.floor(rem);let seconds=Number(((rem-minutes)*60).toFixed(9));
 if(seconds>=60){seconds=0;minutes++}if(minutes>=60){minutes=0;degrees++}
 return {negative,degrees,minutes,seconds};
}
/** DMS accepts nonnegative components and an explicit sign. */
export function fromDMS(degrees,minutes=0,seconds=0,negative=false){
 if(![degrees,minutes,seconds].every(finite)||degrees<0||minutes<0||seconds<0||minutes>=60||seconds>=60||!Number.isInteger(degrees)||!Number.isInteger(minutes)||typeof negative!=='boolean')fail();
 return checked((negative?-1:1)*(degrees+minutes/60+seconds/3600));
}
/** Prime factorization of integers in the implemented 10-digit range. */
export function primeFactors(value){
 if(!Number.isSafeInteger(value)||value<2||value>9999999999)fail();let n=value;const factors=[];
 for(let p=2;p*p<=n;p=p===2?3:p+2){if(n%p)continue;let exponent=0;while(n%p===0){n/=p;exponent++}factors.push({prime:p,exponent})}
 if(n>1)factors.push({prime:n,exponent:1});return factors;
}
/** Engineering notation; shift moves exponent by 3 per step. */
export function engineering(value,shift=0){
 if(!finite(value)||!Number.isSafeInteger(shift)||Math.abs(shift)>100)fail();if(value===0)return {mantissa:0,exponent:shift*3};
 let exponent=Math.floor(Math.log10(Math.abs(value))/3)*3+shift*3;
 if(exponent>306||exponent<-321)fail();let mantissa=checked(value/10**exponent);
 return {mantissa:Number(mantissa.toPrecision(10)),exponent};
}
/** Polar/rectangular conversions obey the selected angular unit. */
export function polar(x,y,unit='DEG'){
 if(!finite(x)||!finite(y))fail();const factor=angleFactor(unit);return {radius:checked(Math.hypot(x,y)),angle:checked(Math.atan2(y,x)/factor)};
}
export function rectangular(radius,angle,unit='DEG'){
 if(!finite(radius)||!finite(angle)||radius<0)fail();const r=angle*angleFactor(unit);return {x:checked(radius*Math.cos(r)),y:checked(radius*Math.sin(r))};
}
/** Explicit rounding to selected display format; result remains a number. */
export function roundToDisplay(value,format='NORM',digits=10){
 if(!finite(value)||!Number.isInteger(digits))fail();
 if(format==='FIX'){if(digits<0||digits>9)fail();const rounded=Number(value.toFixed(digits));return checked(rounded)}
 if(format==='SCI'||format==='NORM'){if(digits<1||digits>10)fail();return checked(Number(value.toPrecision(digits)))}
 fail();
}
export function logBase(base,value){if(!finite(base)||!finite(value)||base<=0||base===1||value<=0)fail();return checked(Math.log(value)/Math.log(base))}
/** Real n-th root, including negative radicands for odd integer index. */
export function nthRoot(index,value){
 if(!finite(index)||!finite(value)||index===0||(value===0&&index<0))fail();
 if(value<0){if(!Number.isInteger(index)||Math.abs(index)%2!==1)fail();return checked(-Math.pow(-value,1/index))}
 return checked(Math.pow(value,1/index));
}
