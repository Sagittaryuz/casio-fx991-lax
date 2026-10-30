import './native-setup.css';

/** Textual SETUP navigation. Only existing settings are offered. */
export function mountNativeSetup(container,store,callbacks={}) {
 if(!container||!store?.get||!store?.set||!store?.reset) throw Error('Configuração indisponível');
 let screen='root',selection=0,format='NORM',destroyed=false;
 const root=document.createElement('section');root.className='native-setup';root.setAttribute('role','group');root.setAttribute('aria-label','Configuração da calculadora');root.tabIndex=0;
 const heading=document.createElement('div');heading.className='native-setup-heading';const list=document.createElement('div');list.className='native-setup-list';const status=document.createElement('output');status.className='native-setup-status';status.setAttribute('aria-live','polite');root.append(heading,list,status);container.replaceChildren(root);
 const screens={root:{title:'CONFIGURAÇÃO',items:[['2','Unidade angular','angle'],['3','Formato número','format'],['9','Reiniciar','reset']]},angle:{title:'Unidade angular',items:[['1','Grau','DEG'],['2','Radiano','RAD'],['3','Grado','GRAD']]},format:{title:'Formato número',items:[['1','Fix','FIX'],['2','Sci','SCI'],['3','Norm','NORM']]},norm:{title:'Norm',items:[['1','Norm 1',1],['2','Norm 2',2]]},digits:{title:'Dígitos',items:Array.from({length:10},(_,n)=>[String(n),String(n),n])},reset:{title:'Reiniciar',items:[['1','Configuração','settings'],...(callbacks.onResetAll?[['2','Todos os dados','all']]:[])]},confirm:{title:'Apagar todos os dados?',items:[['1','Confirmar','confirm'],['2','Cancelar','cancel']]}};
 const parents={angle:'root',format:'root',norm:'format',digits:'format',reset:'root',confirm:'reset'};
 function render(){if(destroyed)return;const data=screens[screen],items=data.items;selection=Math.max(0,Math.min(items.length-1,selection));heading.textContent=data.title;list.replaceChildren();const first=selection>=4?selection-3:0;items.slice(first,first+4).forEach((item,offset)=>{const i=first+offset,b=document.createElement('button');b.type='button';b.className='native-setup-item'+(i===selection?' selected':'');b.setAttribute('aria-pressed',String(i===selection));b.textContent=`${item[0]}: ${item[1]}`;b.addEventListener('click',()=>{selection=i;choose()});list.append(b)});status.textContent=store.getWarning?.()||'';}
 function change(next){screen=next;selection=0;render()}
 function apply(patch){const result=store.set({...store.get(),...patch});callbacks.onApply?.(result.settings,result.warning)}
 function choose(){const item=screens[screen].items[selection];if(!item)return;const value=item[2];try{
  if(screen==='root'){change(value);return}
  if(screen==='angle'){apply({angle:value});return}
  if(screen==='format'){format=value;change(value==='NORM'?'norm':'digits');return}
  if(screen==='digits'||screen==='norm'){apply({format,digits:value});return}
  if(screen==='reset'){if(value==='all'){change('confirm');return}const result=store.reset();callbacks.onApply?.(result.settings,result.warning);return}
  if(screen==='confirm'){if(value==='cancel'){change('reset');return}callbacks.onResetAll?.();const result=store.reset();callbacks.onApply?.(result.settings,result.warning);return}
 }catch(e){status.textContent=e.message||'Erro de configuração'}}
 function press(action){if(destroyed)return false;const items=screens[screen].items;if(action==='clear'||action==='ac'){callbacks.onCancel?.();return true}if(action==='left'||action==='back'||action==='del'){if(parents[screen])change(parents[screen]);else callbacks.onCancel?.();return true}if(action==='up'||action==='down'){selection=Math.max(0,Math.min(items.length-1,selection+(action==='up'?-1:1)));render();return true}if(action==='equals'||action==='right'){choose();return true}if(/^[0-9]$/.test(action)){const index=items.findIndex(item=>item[0]===action);if(index>=0){selection=index;choose();return true}}return false}
 function key(event){const action=({ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Enter:'equals',Escape:'clear',Backspace:'del'})[event.key]||(/^[0-9]$/.test(event.key)?event.key:null);if(action){event.preventDefault();event.stopPropagation();press(action)}}root.addEventListener('keydown',key);render();return {element:root,press,focus:()=>root.focus(),destroy:()=>{destroyed=true;root.remove()}};
}
