import './modes-ui.css';
import './context-options.css';
import { mountLinear } from './ui-linear.js';
import { mountStats } from './ui-stats.js';
import { mountMisc } from './ui-misc.js';
import { mountCalcSolve } from './ui-calc-solve.js';
import { mountSetup } from './settings.js';
import { mountCatalog } from './ui-catalog.js';
import { mountMenuScreen } from './menu-screen.js';

const modes = [
 ['Cálculo','Cálculo'],['Complexos','Complexos'],['Base-N','Base-N'],
 ['Matriz','matrix'],['Vetor','vector'],['Estatística','statistics'],
 ['Distribuição','distribution'],['Planilha','spreadsheet'],['Tabela','table'],
 ['Equação','equation'],['Desigualdade','Desigualdade'],['Proporção','Proporção'],['CALC','calc'],['SOLVE','solve'],['CONST','const'],['CONV','conv']
];
const sessionCache=new Map(),sessionOptions={angle:'DEG'};
/** Scientific modes occupy the LCD only. Calculator buttons remain available. */
export function openModes(options={}) {
 const existing=document.querySelector('.mode-dialog'); if(existing){existing.querySelector('.close-mode')?.click();return;}
 const face=document.querySelector('.face'), bezel=face.querySelector('.display-bezel');const allModes=options.setupStore?[...modes,['SETUP','setup']]:modes;
 const panel=document.createElement('section');panel.className='mode-dialog';panel.setAttribute('role','region');panel.setAttribute('aria-label','Modos científicos');
 panel.innerHTML='<div class="mode-head"><label class="mode-picker-label">Modo <select class="mode-picker" aria-label="Selecionar modo"></select></label><button type="button" class="close-mode" aria-label="Voltar à calculadora">Voltar</button></div><div class="mode-hint">Setas: navegar · =: calcular · AC: limpar</div><section class="mode-content"></section>';
 face.append(panel);const picker=panel.querySelector('.mode-picker'),content=panel.querySelector('.mode-content');let activeField=null,activeIndex=0,modifier=null,optionsOpen=false,optionButtons=[],optionIndex=0,returnFocus=null;const cache=sessionCache;sessionOptions.angle=options.angle||'DEG';sessionOptions.onAccept=options.onAccept?(value,details)=>{options.onAccept(value,details);close()}:null;for(const id of ['calc','solve','setup','const','conv']){const i=allModes.findIndex(m=>m[1]===id);if(i>=0){cache.get(i)?.node.remove();cache.delete(i)}}for(const {node} of cache.values()){node.hidden=true;content.append(node)}
 const syncSize=()=>{const f=face.getBoundingClientRect(),b=bezel.getBoundingClientRect();Object.assign(panel.style,{left:`${b.left-f.left}px`,top:`${b.top-f.top}px`,width:`${b.width}px`,height:`${b.height}px`});};
 const observer=new ResizeObserver(syncSize);observer.observe(face);syncSize();
 allModes.forEach(([name,id],i)=>{const o=document.createElement('option');o.value=id;o.textContent=`${i+1}. ${name}`;picker.append(o)});
 function show(i){hideOptions();if(i<0)i=0;activeIndex=i;picker.value=allModes[i][1];for(const entry of cache.values())entry.node.hidden=true;let entry=cache.get(i);if(!entry){const node=document.createElement('div');content.append(node);let c;const id=allModes[i][1];if(['const','conv'].includes(id))c=mountCatalog(node,id,{...options,onAccept:sessionOptions.onAccept});else if(id==='setup')c=mountSetup(node,options.setupStore,{onApply:(value,warning)=>{options.setupCallbacks?.onApply?.(value,warning);close()},onCancel:()=>{options.setupCallbacks?.onCancel?.();close()},onResetAll:options.setupCallbacks?.onResetAll});else if(['calc','solve'].includes(id))c=mountCalcSolve(node,id,{...options,onAccept:sessionOptions.onAccept});else if(['matrix','vector','equation'].includes(id))c=mountLinear(node,id,sessionOptions);else if(['statistics','distribution','table','spreadsheet'].includes(id))c=mountStats(node,id,sessionOptions);else c=mountMisc(node,id,sessionOptions);entry={node,controller:c};cache.set(i,entry)}entry.node.hidden=false;activeField=null;panel.scrollTop=0;}

 const optionView=document.createElement('section');optionView.className='context-options';optionView.setAttribute('aria-label','Opções do modo');optionView.hidden=true;panel.append(optionView);
 function hideOptions(){if(!optionsOpen)return;optionsOpen=false;optionView.hidden=true;content.hidden=false;picker.disabled=false;optionButtons=[];if(returnFocus?.isConnected){returnFocus.focus();returnFocus.scrollIntoView({block:'nearest'});}returnFocus=null;}
 function showOptions(qr=false){
  if(optionsOpen){hideOptions();return;}
  returnFocus=document.activeElement;optionsOpen=true;content.hidden=true;picker.disabled=true;optionView.hidden=false;optionView.replaceChildren();
  const title=document.createElement('strong');title.textContent=qr?'QR indisponível':'OPTN · '+allModes[activeIndex][0];optionView.append(title);
  const entry=cache.get(activeIndex)?.node,id=allModes[activeIndex][1];let items=[];
  const sel=entry?.querySelector(['matrix','vector','equation'].includes(id)?'[data-op]':['Cálculo','Complexos','Base-N','Proporção','Desigualdade'].includes(id)?'[data-misc-operation]':['statistics','distribution'].includes(id)?'.stats-mode > label select':':not(*)');
  if(qr){const note=document.createElement('p');note.textContent='QR não está disponível; nenhum dado é transmitido.';optionView.append(note)}
  else if(sel){items=[...sel.options].map(o=>({label:o.textContent,select:sel,value:o.value}));}
  else if(entry){const labels=id==='spreadsheet'?['Copiar','Mover','Preencher']:id==='table'?['Gerar tabela']:['Calcular','Usar resultado'];items=[...entry.querySelectorAll('button')].filter(b=>labels.includes(b.textContent.trim())&&!b.disabled).map(b=>({label:b.textContent.trim(),button:b}));}
  if(!qr&&!items.length){const note=document.createElement('p');note.textContent='Não há opções adicionais neste modo.';optionView.append(note)}
  function add(label,act){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',act);optionView.append(b);optionButtons.push(b)}
  items.forEach(item=>add(item.label,()=>{hideOptions();if(item.select){if(item.select.value!==item.value){item.select.value=item.value;item.select.dispatchEvent(new Event('change',{bubbles:true}));}item.select.focus();activeField=item.select;item.select.scrollIntoView({block:'nearest'});}else{item.button.focus();item.button.scrollIntoView({block:'nearest'});}}));
  add('Voltar',hideOptions);optionIndex=0;optionButtons[0]?.focus();panel.scrollTop=0;
 }
 picker.addEventListener('change',()=>show(allModes.findIndex(m=>m[1]===picker.value)));
 panel.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select')&&e.target!==picker)activeField=e.target;});
 const fields=()=>[...cache.get(activeIndex).node.querySelectorAll('input:not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled])')].filter(e=>e.offsetParent!==null);
 function focusStep(delta){const list=fields();if(!list.length){picker.focus();return;}let i=list.indexOf(activeField);i=i<0?(delta>0?0:list.length-1):Math.max(0,Math.min(list.length-1,i+delta));list[i].focus();if(list[i].matches('input,textarea,select'))activeField=list[i];list[i].scrollIntoView({block:'nearest'});}
 function press(action){
  if(action==='shift'||action==='alpha'){modifier=modifier===action?null:action;panel.dataset.modifier=modifier||'';return;}
  const shifted=modifier==='shift',alphad=modifier==='alpha';modifier=null;panel.dataset.modifier='';
  if(alphad){const map={negative:'A',dms:'B',inverse:'C',sin:'D',cos:'E',tan:'F',')':'x',toggleExact:'y',memory:'M',exp:'e',calc:'='};if(Object.hasOwn(map,action))action=map[action];else return;}
  if(action==='optn'){showOptions(shifted);return;}
  if(optionsOpen){if(action==='up'||action==='down'){optionIndex=Math.max(0,Math.min(optionButtons.length-1,optionIndex+(action==='up'?-1:1)));optionButtons[optionIndex]?.focus()}else if(action==='equals'){(document.activeElement?.closest('.context-options button')||optionButtons[optionIndex])?.click()}else if(action==='menu'||action==='clear')hideOptions();return;}
  if(action==='clear'&&allModes[activeIndex][1]==='setup'){close();return}
  if(action==='menu'){close();openIconMenu(options);return;}
  if(action==='on')return;
  if(action==='up'||action==='down'){if(document.activeElement===picker){show((activeIndex+(action==='up'?-1:1)+allModes.length)%allModes.length);picker.focus()}else focusStep(action==='up'?-1:1);return;}
  if(document.activeElement===picker&&/^[1-9]$/.test(action)){show(Number(action)-1);picker.focus();return;}
  if(action==='equals'){if(document.activeElement?.tagName==='BUTTON'&&panel.contains(document.activeElement)){document.activeElement.click();return}const run=[...cache.get(activeIndex).node.querySelectorAll('button')].find(b=>/^(Calcular|Gerar tabela)$/i.test(b.textContent.trim()));activeField?.blur();if(run){run.click();const result=cache.get(activeIndex).node.querySelector('[data-output],[data-misc-result],output,.stats-output');(result||run).scrollIntoView({block:'nearest'});}else focusStep(1);return;}
  if(!activeField||!activeField.isConnected||activeField.offsetParent===null){focusStep(1);return;}
  if(activeField.tagName==='SELECT'){if(action==='left'||action==='right'){const count=activeField.options.length;activeField.selectedIndex=(activeField.selectedIndex+(action==='left'?-1:1)+count)%count;activeField.dispatchEvent(new Event('change',{bubbles:true}));}return;}
  if(action==='clear'){activeField.value='';activeField.dispatchEvent(new Event('input',{bubbles:true}));activeField.focus();return;}
  if(action==='left'||action==='right'){if(activeField.type==='number')return;const pos=activeField.selectionStart??0;const n=Math.max(0,Math.min(activeField.value.length,pos+(action==='left'?-1:1)));activeField.focus();activeField.setSelectionRange(n,n);return;}
  const map={'fraction':'/','sqrt':shifted?'cbrt(':'sqrt(','square':shifted?'^3':'^2','power':'^','inverse':shifted?'!':'^(-1)','negative':'-','variableX':'x','exp':shifted?'pi':'*10^','ans':shifted?'%':'Ans',',':',','sin':shifted?'asin(':'sin(','cos':shifted?'acos(':'cos(','tan':shifted?'atan(':'tan(','log':shifted?'10^':'log(','ln':shifted?'e^':'ln('};
  const value=map[action]??action;if(action!=='del'&&!/^[0-9A-FMxy e=+*/^(),.%-]$/.test(value)&&!Object.hasOwn(map,action))return;
  if(activeField.type==='number'){activeField.value=action==='del'?activeField.value.slice(0,-1):activeField.value+value;activeField.dispatchEvent(new Event('input',{bubbles:true}));return;}
  const start=activeField.selectionStart??activeField.value.length,end=activeField.selectionEnd??start;const at=action==='del'&&start===end?Math.max(0,start-1):start,insert=action==='del'?'':value;
  activeField.value=activeField.value.slice(0,at)+insert+activeField.value.slice(end);activeField.focus();activeField.setSelectionRange(at+insert.length,at+insert.length);activeField.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function capture(e){const button=e.target.closest('button[data-action]');if(!button||!face.contains(button)||panel.contains(button))return;e.preventDefault();e.stopImmediatePropagation();press(button.dataset.action);}
 function preventFocus(e){if(e.target.closest('button[data-action]')&&!panel.contains(e.target))e.preventDefault();}
 function key(e){if(e.key==='Escape'){e.preventDefault();if(optionsOpen)hideOptions();else close();}}
 function close(){activeField?.blur();for(const {node} of cache.values())node.remove();observer.disconnect();face.removeEventListener('click',capture,true);face.removeEventListener('pointerdown',preventFocus,true);panel.removeEventListener('keydown',key);panel.remove();face.querySelector('[data-action=menu]')?.focus();}
 panel.querySelector('.close-mode').addEventListener('click',close);panel.addEventListener('keydown',key);face.addEventListener('click',capture,true);face.addEventListener('pointerdown',preventFocus,true);show(Math.max(0,allModes.findIndex(m=>m[1]===options.initialMode)));if(options.initialOperation){const c=cache.get(activeIndex)?.controller;c?.setOperation?.(options.initialOperation,options.expression)}const first=options.initialMode?cache.get(activeIndex)?.node.querySelector('input,select'):null;(first||picker).focus();if(options.initialOptions)showOptions();
}

/** Open staged settings in the calculator LCD; saving and reset remain explicit. */
export function openSetup(store,callbacks={}) {return openModes({...callbacks,initialMode:'setup',setupStore:store,setupCallbacks:callbacks})}
/** Discard in-memory mode editors after explicit full reset. */
export function resetModes(){for(const entry of sessionCache.values()){if(typeof entry.controller==='function')entry.controller();else entry.controller?.destroy?.();entry.node.remove()}sessionCache.clear()}

/** Open contextual calculation options without changing the current expression. */
export function openOptions(options={}){return openModes({...options,initialMode:'Cálculo',initialOptions:true})}

/** Icon menu modeled on LA X guide p.3; original modes remain available after selection. */
export function openIconMenu(options={}) {
 if(document.querySelector('.mode-dialog')) return;
 const face=document.querySelector('.face'),bezel=face.querySelector('.display-bezel');
 const panel=document.createElement('section');panel.className='mode-dialog fx-menu-host';panel.setAttribute('role','region');panel.setAttribute('aria-label','Menu principal');face.append(panel);
 const sync=()=>{const f=face.getBoundingClientRect(),b=bezel.getBoundingClientRect();Object.assign(panel.style,{left:`${b.left-f.left}px`,top:`${b.top-f.top}px`,width:`${b.width}px`,height:`${b.height}px`})};const observer=new ResizeObserver(sync);observer.observe(face);sync();
 let screen;function close(){observer.disconnect();face.removeEventListener('click',capture,true);face.removeEventListener('pointerdown',prevent,true);screen?.destroy();panel.remove()}
 screen=mountMenuScreen(panel,{onSelect:id=>{close();if(id!=='Cálculo')openModes({...options,initialMode:id});else face.querySelector('[data-action=menu]')?.focus()},onCancel:()=>{close();face.querySelector('[data-action=menu]')?.focus()}});
 function capture(e){const b=e.target.closest('button[data-action]');if(!b||!face.contains(b)||panel.contains(b))return;e.preventDefault();e.stopImmediatePropagation();if(b.dataset.action==='menu'){close();face.querySelector('[data-action=menu]')?.focus()}else screen.press(b.dataset.action)}
 function prevent(e){if(e.target.closest('button[data-action]')&&!panel.contains(e.target))e.preventDefault()}
 face.addEventListener('click',capture,true);face.addEventListener('pointerdown',prevent,true);screen.focus();
}
