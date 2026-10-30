/** Catalog menus. Selecting and calculating are staged; only confirmation calls onAccept. */
import {CONSTANTS, CONVERSIONS, getConstant, convert} from './catalog.js';
import {evaluate} from './engine.js';
import './ui-misc.css';

export function mountCatalog(container, kind, options={}) {
 if(!['const','conv'].includes(kind)) throw Error('Catálogo inválido');
 const data=kind==='const'?CONSTANTS:CONVERSIONS;
 const root=document.createElement('section');root.className='misc-editor catalog-editor';
 const label=(text,control)=>{const node=document.createElement('label');node.className='misc-field';node.append(text,control);return node};
 const category=document.createElement('select');category.dataset.catalogCategory='';
 for(const name of [...new Set(data.map(item=>item.category))]){const option=document.createElement('option');option.value=name;option.textContent=name;category.append(option)}
 const entry=document.createElement('select');entry.dataset.catalogEntry='';
 const value=document.createElement('input');value.type='text';value.inputMode='decimal';value.value=String(options.value??options.ans??0).replace('.',',');value.setAttribute('aria-label','Valor a converter');value.dataset.catalogInput='';
 const out=document.createElement('output');out.className='misc-output';out.dataset.catalogResult='';out.setAttribute('role','status');out.setAttribute('aria-live','polite');
 const run=document.createElement('button');run.type='button';run.className='misc-calculate';run.textContent='Calcular';
 const apply=document.createElement('button');apply.type='button';apply.className='misc-calculate';apply.textContent=kind==='const'?'Inserir constante':'Usar resultado';apply.disabled=true;
 root.append(label('Categoria',category),label(kind==='const'?'Constante':'Conversão',entry));if(kind==='conv')root.append(label('Valor',value));root.append(run,out,apply);container.replaceChildren(root);
 let pending=null;
 function reset(){pending=null;out.textContent='';apply.disabled=true}
 function updateEntries(){const selected=data.filter(item=>item.category===category.value);entry.replaceChildren(...selected.map(item=>{const option=document.createElement('option');option.value=String(item.id);option.textContent=kind==='const'?`${item.id} · ${item.label} (${item.symbol})`:`${item.id} · ${item.label}`;return option}));reset()}
 category.addEventListener('change',updateEntries);entry.addEventListener('change',reset);value.addEventListener('input',reset);updateEntries();
 function calculate(){try{const id=entry.value;if(!id)throw Error('Selecione uma opção');if(kind==='const'){const item=getConstant(id);pending=item.value;out.textContent=`${item.symbol} = ${Number(item.value.toPrecision(10)).toString().replace('.',',')} ${item.unit||''}`.trim()}else{const expr=value.value.trim().replaceAll(',','.').replaceAll(';',',');if(!expr)throw Error('Informe um valor');const amount=evaluate(expr,{angle:options.angle||'DEG',ans:options.ans??0,variables:options.variables||{}});pending=convert(id,amount);out.textContent=Number(pending.toPrecision(10)).toString().replace('.',',')}if(!Number.isFinite(pending))throw Error('Math ERROR');apply.disabled=false}catch(e){pending=null;apply.disabled=true;out.textContent=`Erro: ${e.message}`}}
 run.addEventListener('click',calculate);apply.addEventListener('click',()=>{if(pending!==null)options.onAccept?.(pending,{kind:kind==='const'?'constant':'conversion',id:entry.value})});root.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('input')){e.preventDefault();calculate()}});
 return {element:root,calculate,destroy:()=>container.replaceChildren()};
}
