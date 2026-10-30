import { evaluate } from './engine.js';

const VARIABLE_NAMES = new Set(['A','B','C','D','E','F','x','y','M']);
const fail = message => { throw new Error(message); };

/** List variables recognized by the real evaluator, without confusing e, Ans, or function names. */
export function expressionVariables(expression) {
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
export function calculate(expression, variables={}, options={}) {
  const parts=equationParts(expression);checkValues(expressionVariables(expression),variables);
  return sides(parts,variables,options).residual;
}
/**
 * SOLVE: safeguarded Newton iteration for a real root, initialized by the caller.
 * The returned residual is L−R. It finds at most one root and may reject a valid
 * equation when derivatives are flat, the initial guess is unsuitable, or a
 * discontinuity/domain prevents reliable convergence. No symbolic guarantees.
 */
export function solve(expression, variable='x', initial=0, variables={}, options={}) {
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
