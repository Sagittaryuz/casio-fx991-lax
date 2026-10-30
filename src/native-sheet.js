import {Spreadsheet,loadSpreadsheet,saveSpreadsheet,SPREADSHEET_STORAGE_KEY} from './spreadsheet.js';
import './native-sheet.css';

/** Display-only spreadsheet controller. Data is independent of the current DOM. */
export function mountNativeSheet(host, options={}) {
 let storage;try{storage=options.storage??globalThis.localStorage}catch{storage=null}
 const loaded=loadSpreadsheet(storage,options);let sheet=loaded.sheet,blocked=loaded.blocked;
 let col=0,row=1,startCol=0,startRow=1,editing=false,buffer='',position=0,modifier=null,menu=null,menuIndex=0,message=loaded.error||'',destroyed=false;
 const root=document.createElement('section');root.className='native-sheet';root.tabIndex=0;root.setAttribute('role','application');root.setAttribute('aria-label','Planilha científica');host.replaceChildren(root);
 const cell=()=>String.fromCharCode(65+col)+row;
 const persist=()=>{if(blocked){message='Dados salvos inválidos preservados; gravação suspensa.';return false}if(!saveSpreadsheet(storage,sheet)){message='Não foi possível salvar a planilha.';return false}message='';return true};
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const display=addr=>{const raw=sheet.get(addr);if(!raw)return '';try{const x=sheet.value(addr);return Number(x.toPrecision(8)).toString().replace('.',',')}catch{return 'Erro'}};
 function show(){if(destroyed)return;if(col<startCol)startCol=col;if(col>startCol+3)startCol=col-3;if(row<startRow)startRow=row;if(row>startRow+3)startRow=row-3;
  let rows='';for(let r=startRow;r<=Math.min(startRow+3,45);r++){rows+=`<tr><th>${r}</th>`;for(let c=startCol;c<=Math.min(startCol+3,4);c++){const id=String.fromCharCode(65+c)+r;rows+=`<td><button type="button" data-cell="${id}" class="${c===col&&r===row?'selected':''}" aria-label="${id}: ${esc(sheet.get(id)||'vazia')}">${esc(display(id))}</button></td>`}rows+='</tr>'}
  const cols=Array.from({length:Math.min(4,5-startCol)},(_,i)=>`<th>${String.fromCharCode(65+startCol+i)}</th>`).join('');
  const edit=editing?`<input data-sheet-edit aria-label="Editar ${cell()}" autocomplete="off" value="${esc(buffer)}">`:`<span class="sheet-raw">${esc(sheet.get(cell()))}</span>`;
  const optionsMenu=menu?`<div class="sheet-ops"><strong>OPTN</strong><button data-op="copy">Copiar</button><button data-op="move">Mover</button><button data-op="fill">Preencher</button><button data-op="back">Voltar</button><span>${esc(message)}</span></div>`:'';
  root.innerHTML=`<div class="sheet-title">Planilha <span>${cell()}</span></div><table><thead><tr><th></th>${cols}</tr></thead><tbody>${rows}</tbody></table><div class="sheet-entry"><b>${cell()}</b> ${edit}</div><div class="sheet-notice" role="status">${esc(message)} ${blocked?'<button type="button" data-recover>Nova planilha</button>':''}</div>${optionsMenu}`;
  root.querySelector('[data-recover]')?.addEventListener('click',()=>{root.innerHTML='<div class="sheet-op-form">Dados salvos inválidos serão substituídos.<button data-yes>Confirmar</button><button data-no>Cancelar</button></div>';root.querySelector('[data-no]').onclick=show;root.querySelector('[data-yes]').onclick=()=>{try{if(!storage)throw Error();storage.removeItem(SPREADSHEET_STORAGE_KEY);sheet=new Spreadsheet(options);blocked=false;message='';persist();show()}catch{message='Não foi possível reiniciar a planilha.';show()}}});
  root.querySelectorAll('[data-cell]').forEach(el=>el.addEventListener('click',()=>{if(editing)commit();const m=el.dataset.cell.match(/^([A-E])(\d+)$/);col=m[1].charCodeAt(0)-65;row=+m[2];show()}));
  root.querySelectorAll('[data-op]').forEach(el=>el.addEventListener('click',()=>{if(el.dataset.op==='back'){menu=null;message='';show()}else beginOperation(el.dataset.op)}));
  const inp=root.querySelector('[data-sheet-edit]');if(inp){inp.focus({preventScroll:true});inp.setSelectionRange(position,position);inp.addEventListener('input',()=>{buffer=inp.value;position=inp.selectionStart??buffer.length});inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit();move(0,1)}else if(e.key==='Escape'){e.preventDefault();cancel()}e.stopPropagation()})}
 }
 function begin(){editing=true;buffer=sheet.get(cell());position=buffer.length;show()}
 function commit(){if(!editing)return;sheet.set(cell(),buffer);editing=false;persist()}
 function cancel(){editing=false;buffer='';position=0;show()}
 function move(dc,dr){if(editing)commit();col=Math.max(0,Math.min(4,col+dc));row=Math.max(1,Math.min(45,row+dr));show()}
 function beginOperation(op){menu=op;root.innerHTML=`<div class="sheet-op-form"><strong>${{copy:'Copiar',move:'Mover',fill:'Preencher'}[op]}</strong><label>Origem <input data-from value="${cell()}" aria-label="Origem"></label><label>Destino <input data-to value="${cell()}" aria-label="Destino"></label><button data-confirm>Executar</button><button data-cancel>Cancelar</button><output role="status"></output></div>`;root.querySelector('[data-confirm]').onclick=()=>{try{const from=root.querySelector('[data-from]').value.trim(),to=root.querySelector('[data-to]').value.trim(),next=Spreadsheet.fromSnapshot(sheet.snapshot(),options);next[op](from,to);sheet=next;persist();menu=null;message='Concluído';show()}catch(e){root.querySelector('output').textContent='Erro: '+e.message}};root.querySelector('[data-cancel]').onclick=()=>{menu=null;message='';show()};root.querySelector('[data-from]').focus()}
 const translate={negative:'-',fraction:'/',sqrt:'sqrt(',square:'^2',power:'^',inverse:'^(-1)',variableX:'x',exp:'*10^',ans:'Ans',sin:'sin(',cos:'cos(',tan:'tan(',log:'log(',ln:'ln(', ',':'.'};
 function press(action){if(action==='shift'||action==='alpha'){modifier=modifier===action?null:action;return true}const shifted=modifier==='shift',alpha=modifier==='alpha';modifier=null;
  if(menu){if(action==='clear'){menu=null;message='';show();return true}if(menu==='list'){const names=['copy','move','fill','back'];if(action==='up'||action==='down'){menuIndex=(menuIndex+(action==='up'?-1:1)+names.length)%names.length;root.querySelector(`[data-op="${names[menuIndex]}"]`)?.focus();return true}if(action==='equals'){if(names[menuIndex]==='back'){menu=null;show()}else beginOperation(names[menuIndex]);return true}return false}const inputs=[...root.querySelectorAll('[data-from],[data-to]')];let active=root.contains(document.activeElement)&&document.activeElement.matches('input')?document.activeElement:inputs[0];if(action==='up'||action==='down'){inputs[action==='up'?0:1]?.focus();return true}if(action==='equals'){root.querySelector('[data-confirm]')?.click();return true}if(action==='del'){active.value=active.value.slice(0,-1);return true}let ch=alpha?({negative:'A',dms:'B',inverse:'C',sin:'D',cos:'E'})[action]:action;if(ch&&/^[A-E0-9]$/.test(ch)){active.value+=ch;active.focus();return true}return false}
  if(action==='optn'){if(editing)commit();menu='list';menuIndex=0;show();root.querySelector('[data-op=copy]')?.focus();return true}
  if(action==='up'||action==='down'||action==='left'||action==='right'){if(editing&&(action==='left'||action==='right')){position=Math.max(0,Math.min(buffer.length,position+(action==='left'?-1:1)));show()}else move(action==='left'?-1:action==='right'?1:0,action==='up'?-1:action==='down'?1:0);return true}
  if(action==='equals'){if(editing){commit();move(0,1)}else begin();return true}
  if(action==='clear'){if(editing)cancel();else options.onBack?.();return true}
  if(action==='del'){if(!editing)begin();if(position){buffer=buffer.slice(0,position-1)+buffer.slice(position);position--}show();return true}
  let value=alpha?({negative:'A',dms:'B',inverse:'C',sin:'D',cos:'E',calc:'='})[action]:translate[action]??action;
  if(shifted&&action==='exp')value='pi';if(!value||(!alpha&&!Object.hasOwn(translate,action)&&!/^\d$/.test(value)&&!['+','-','*','/','(',')'].includes(value)))return false;
  if(!editing){editing=true;buffer='';position=0}buffer=buffer.slice(0,position)+value+buffer.slice(position);position+=value.length;show();return true;
 }
 root.addEventListener('keydown',e=>{if(e.target.matches('input'))return;const action=({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'equals',Escape:'clear',Backspace:'del','+':'+','-':'-','*':'*','/':'/', '.':','})[e.key]||(/^\d$/.test(e.key)?e.key:null);if(action){e.preventDefault();e.stopPropagation();press(action)}});
 show();return {element:root,press,focus:()=>root.focus(),destroy:()=>{destroyed=true;root.remove()},snapshot:()=>sheet.snapshot(),getSelected:cell};
}
