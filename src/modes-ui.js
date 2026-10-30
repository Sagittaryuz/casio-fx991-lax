import './modes-ui.css';
import { mountLinear } from './ui-linear.js';
import { mountStats } from './ui-stats.js';
import { mountMisc } from './ui-misc.js';

const modes = [
 ['Cálculo','Cálculo'],['Complexos','Complexos'],['Base-N','Base-N'],
 ['Matriz','matrix'],['Vetor','vector'],['Estatística','statistics'],
 ['Distribuição','distribution'],['Planilha','spreadsheet'],['Tabela','table'],
 ['Equação','equation'],['Desigualdade','Desigualdade'],['Proporção','Proporção']
];
const sessionCache=new Map(),sessionOptions={angle:'DEG'};
/** Scientific modes occupy the LCD only. Calculator buttons remain available. */
export function openModes(options={}) {
 const existing=document.querySelector('.mode-dialog'); if(existing){existing.querySelector('.close-mode')?.click();return;}
 const face=document.querySelector('.face'), bezel=face.querySelector('.display-bezel');
 const panel=document.createElement('section');panel.className='mode-dialog';panel.setAttribute('role','region');panel.setAttribute('aria-label','Modos científicos');
 panel.innerHTML='<div class="mode-head"><label class="mode-picker-label">Modo <select class="mode-picker" aria-label="Selecionar modo"></select></label><button type="button" class="close-mode" aria-label="Voltar à calculadora">Voltar</button></div><div class="mode-hint">Setas: navegar · =: calcular · AC: limpar</div><section class="mode-content"></section>';
 face.append(panel);const picker=panel.querySelector('.mode-picker'),content=panel.querySelector('.mode-content');let activeField=null,activeIndex=0;const cache=sessionCache;sessionOptions.angle=options.angle||'DEG';for(const {node} of cache.values()){node.hidden=true;content.append(node)}
 const syncSize=()=>{const f=face.getBoundingClientRect(),b=bezel.getBoundingClientRect();Object.assign(panel.style,{left:`${b.left-f.left}px`,top:`${b.top-f.top}px`,width:`${b.width}px`,height:`${b.height}px`});};
 const observer=new ResizeObserver(syncSize);observer.observe(face);syncSize();
 modes.forEach(([name,id],i)=>{const o=document.createElement('option');o.value=id;o.textContent=`${i+1}. ${name}`;picker.append(o)});
 function show(i){activeIndex=i;picker.value=modes[i][1];for(const entry of cache.values())entry.node.hidden=true;let entry=cache.get(i);if(!entry){const node=document.createElement('div');content.append(node);let c;const id=modes[i][1];if(['matrix','vector','equation'].includes(id))c=mountLinear(node,id);else if(['statistics','distribution','table','spreadsheet'].includes(id))c=mountStats(node,id,sessionOptions);else c=mountMisc(node,id,sessionOptions);entry={node,controller:c};cache.set(i,entry)}entry.node.hidden=false;activeField=null;panel.scrollTop=0;}
 picker.addEventListener('change',()=>show(modes.findIndex(m=>m[1]===picker.value)));
 panel.addEventListener('focusin',e=>{if(e.target.matches('input,textarea,select')&&e.target!==picker)activeField=e.target;});
 const fields=()=>[...cache.get(activeIndex).node.querySelectorAll('input:not([disabled]),textarea:not([disabled]),select:not([disabled]),button:not([disabled])')].filter(e=>e.offsetParent!==null);
 function focusStep(delta){const list=fields();if(!list.length){picker.focus();return;}let i=list.indexOf(activeField);i=i<0?(delta>0?0:list.length-1):Math.max(0,Math.min(list.length-1,i+delta));list[i].focus();if(list[i].matches('input,textarea,select'))activeField=list[i];list[i].scrollIntoView({block:'nearest'});}
 function press(action){
  if(action==='menu'){picker.focus();panel.scrollTop=0;return;}
  if(action==='on')return;
  if(action==='up'||action==='down'){if(document.activeElement===picker){show((activeIndex+(action==='up'?-1:1)+modes.length)%modes.length);picker.focus()}else focusStep(action==='up'?-1:1);return;}
  if(document.activeElement===picker&&/^[1-9]$/.test(action)){show(Number(action)-1);picker.focus();return;}
  if(action==='equals'){const run=[...cache.get(activeIndex).node.querySelectorAll('button')].find(b=>/^(Calcular|Gerar tabela)$/i.test(b.textContent.trim()));activeField?.blur();if(run){run.click();const result=cache.get(activeIndex).node.querySelector('[data-output],[data-misc-result],output,.stats-output');(result||run).scrollIntoView({block:'nearest'});}else focusStep(1);return;}
  if(!activeField||!activeField.isConnected||activeField.offsetParent===null){focusStep(1);return;}
  if(activeField.tagName==='SELECT'){if(action==='left'||action==='right'){const count=activeField.options.length;activeField.selectedIndex=(activeField.selectedIndex+(action==='left'?-1:1)+count)%count;activeField.dispatchEvent(new Event('change',{bubbles:true}));}return;}
  if(action==='clear'){activeField.value='';activeField.dispatchEvent(new Event('input',{bubbles:true}));activeField.focus();return;}
  if(action==='left'||action==='right'){if(activeField.type==='number')return;const pos=activeField.selectionStart??0;const n=Math.max(0,Math.min(activeField.value.length,pos+(action==='left'?-1:1)));activeField.focus();activeField.setSelectionRange(n,n);return;}
  const map={'fraction':'/','sqrt':'sqrt(','square':'^2','power':'^','inverse':'^(-1)','negative':'-','variableX':'x','exp':'*10^','ans':'Ans',',':',','sin':'sin(','cos':'cos(','tan':'tan(','log':'log(','ln':'ln('};
  const value=map[action]??action;if(action!=='del'&&!/^[0-9+*/^(),.-]$/.test(value)&&!Object.hasOwn(map,action))return;
  if(activeField.type==='number'){activeField.value=action==='del'?activeField.value.slice(0,-1):activeField.value+value;activeField.dispatchEvent(new Event('input',{bubbles:true}));return;}
  const start=activeField.selectionStart??activeField.value.length,end=activeField.selectionEnd??start;const at=action==='del'&&start===end?Math.max(0,start-1):start,insert=action==='del'?'':value;
  activeField.value=activeField.value.slice(0,at)+insert+activeField.value.slice(end);activeField.focus();activeField.setSelectionRange(at+insert.length,at+insert.length);activeField.dispatchEvent(new Event('input',{bubbles:true}));
 }
 function capture(e){const button=e.target.closest('button[data-action]');if(!button||!face.contains(button)||panel.contains(button))return;e.preventDefault();e.stopImmediatePropagation();press(button.dataset.action);}
 function preventFocus(e){if(e.target.closest('button[data-action]')&&!panel.contains(e.target))e.preventDefault();}
 function key(e){if(e.key==='Escape'){e.preventDefault();close();}}
 function close(){activeField?.blur();for(const {node} of cache.values())node.remove();observer.disconnect();face.removeEventListener('click',capture,true);face.removeEventListener('pointerdown',preventFocus,true);panel.removeEventListener('keydown',key);panel.remove();face.querySelector('[data-action=menu]')?.focus();}
 panel.querySelector('.close-mode').addEventListener('click',close);panel.addEventListener('keydown',key);face.addEventListener('click',capture,true);face.addEventListener('pointerdown',preventFocus,true);show(0);picker.focus();
}
