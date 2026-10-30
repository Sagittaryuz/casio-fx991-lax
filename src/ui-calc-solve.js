import {expressionVariables,calculate,solve} from './solve.js';

/** CALC/SOLVE are session dialogs. The caller owns the expression and commits only on Apply. */
export function mountCalcSolve(container,kind,options={}) {
 const root=document.createElement('section');root.className='misc-editor calc-solve';
 const label=(name,control)=>{const l=document.createElement('label');l.className='misc-field';l.append(name,control);return l};
 const input=(value='')=>{const e=document.createElement('input');e.type='text';e.autocomplete='off';e.inputMode='decimal';e.value=String(value);return e};
 const equation=input(options.expression||'');equation.inputMode='text';equation.dataset.equation='';root.append(label('Expressão ou equação',equation));
 const variableSelect=document.createElement('select');variableSelect.dataset.solveVariable='';const varLabel=label('Resolver para',variableSelect);if(kind==='solve')root.append(varLabel);
 const vars=document.createElement('div');vars.className='misc-fields';root.append(vars);
 const run=document.createElement('button');run.type='button';run.textContent='Calcular';root.append(run);
 const out=document.createElement('output');out.dataset.calcResult='';out.setAttribute('aria-live','polite');root.append(out);
 const apply=document.createElement('button');apply.type='button';apply.textContent='Usar resultado';apply.disabled=true;root.append(apply);container.replaceChildren(root);
 let value=null, previous={...(options.variables||{})};
 const normal=s=>s.replace(/(\d),(?=\d)/g,'$1.').replaceAll(';',',');
 function renderVars(){
  const old=Object.fromEntries([...vars.querySelectorAll('input')].map(e=>[e.name,e.value]));const names=expressionVariables(normal(equation.value));const target=variableSelect.value;
  variableSelect.replaceChildren(...names.map(n=>{const o=document.createElement('option');o.value=n;o.textContent=n;return o}));if(names.includes(target))variableSelect.value=target;else if(names.includes('x'))variableSelect.value='x';
  vars.replaceChildren();for(const n of names){const v=input(old[n]??previous[n]??0);v.name=n;v.dataset.variable=n;vars.append(label(kind==='solve'&&n===variableSelect.value?`${n} (valor inicial)`:n,v))}value=null;apply.disabled=true;out.textContent='';
 }
 equation.addEventListener('input',renderVars);variableSelect.addEventListener('change',renderVars);
 function execute(){try{const values={};for(const f of vars.querySelectorAll('input')){let text=f.value.trim().replace(',','.');if(!text||!Number.isFinite(Number(text)))throw Error('Valor inválido');values[f.name]=Number(text)}const expr=normal(equation.value),opts={angle:options.angle||'DEG',ans:options.ans??0,memory:values.M??0};let result;if(kind==='solve'){const name=variableSelect.value;if(!name)throw Error('Informe uma variável');result=solve(expr,name,values[name],values,opts);value=result.root;out.textContent=`${name} = ${Number(value.toPrecision(10))} · L−R = ${Number(result.residual.toPrecision(4))}`;}else{value=calculate(expr,values,opts);out.textContent=String(Number(value.toPrecision(10))).replace('.',',')}previous=values;apply.disabled=false;}catch(e){value=null;apply.disabled=true;out.textContent=`Erro: ${e.message}`}}
 run.addEventListener('click',execute);apply.addEventListener('click',()=>{if(value!==null)options.onAccept?.(value,{kind,variable:variableSelect.value,variables:previous});});
 root.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();execute()}});
 renderVars();return {element:root,calculate:execute};
}
