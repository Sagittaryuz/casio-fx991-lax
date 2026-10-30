import {oneVariable,twoVariable,regression} from './statistics.js';
import {evaluate} from './engine.js';
import './native-statistics.css';

const TYPES=[['one','1 variável'],['linear','y = a + bx'],['quadratic','y = a + bx + cx²'],['logarithmic','y = a + b ln(x)'],['exponential','y = a·e^(bx)'],['power','y = a·x^b'],['inverse','y = a + b/x'],['two','2 variáveis']];
const NAME={n:'n',sum:'Σx',sumSquares:'Σx²',mean:'x̄',populationSD:'σx',sampleSD:'sx',min:'mín',q1:'Q1',median:'Med',q3:'Q3',max:'máx',sumX:'Σx',sumY:'Σy',sumX2:'Σx²',sumY2:'Σy²',sumXY:'Σxy',meanX:'x̄',meanY:'ȳ',populationSDX:'σx',populationSDY:'σy',sampleSDX:'sx',sampleSDY:'sy',a:'a',b:'b',c:'c',r:'r'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>Number.isFinite(v)?String(Number(v.toPrecision(10))).replace('.',','):'—';
/** Session-scoped statistical editor and controller; onBack() returns to mode menu. */
export function mountNativeStatistics(host,options={}){
 const root=document.createElement('section');root.className='native-statistics';root.tabIndex=0;root.setAttribute('role','application');root.setAttribute('aria-label','Estatística');host.replaceChildren(root);
 let page='types',typeIndex=0,type='one',rows=[],frequency=false,col=0,row=0,top=0,editing=false,buffer='',cursor=0,selected=0,results=[],warning='',pendingType=-1;
 const names=()=>frequency?(type==='one'?['X','Freq']:['X','Y','Freq']):(type==='one'?['X']:['X','Y']);
 const raw=(r,c)=>rows[r]?.[names()[c]]??'';
 const ensure=r=>{while(rows.length<=r)rows.push({X:'',Y:'',Freq:'1'})};
 function toNumbers(){const data=[];for(const r of rows){if(!r.X.trim()&&!r.Y.trim())continue;if(!r.X.trim()||(type!=='one'&&!r.Y.trim()))throw Error('Dados incompletos');const n=s=>evaluate(s.replaceAll(',','.'),options);const f=frequency?n(r.Freq):1;data.push(type==='one'?[n(r.X),f]:[n(r.X),n(r.Y),f])}if(!data.length)throw Error('Sem dados');return data}
 function calc(which){try{const data=toNumbers(),v=which==='one'?oneVariable(data):which==='two'?twoVariable(data):regression(data,type);results=Object.entries(v).filter(([,x])=>typeof x==='number').map(([k,x])=>[NAME[k]||k,fmt(x)]);page='results';selected=0;warning=''}catch(e){warning=e.message==='Math ERROR'?'Math ERROR':e.message}render()}
 function optionItems(){return [['type','Selecionar tipo'],['data','Dados'],[type==='one'?'one':'two',type==='one'?'Cálc 1 variável':'Cálc 2 variáveis'],...(type!=='one'&&type!=='two'?[['regression','Cálc regressão']]:[]),['frequency',frequency?'Frequência: ligada':'Frequência: desligada'],['insert','Inserir linha'],['delete','Excluir linha'],['back','Voltar']];}
 function list(items,title){const topIndex=Math.max(0,selected-3);return `<strong>${title}</strong><ol start="${topIndex+1}">${items.slice(topIndex,topIndex+4).map((x,i)=>`<li><button type="button" data-list="${topIndex+i}" class="${selected===topIndex+i?'selected':''}">${esc(Array.isArray(x)?x[1]:x)}</button></li>`).join('')}</ol>`}
 function render(){
  if(page==='types') root.innerHTML=list(TYPES,'Selecionar tipo');
  else if(page==='confirm') root.innerHTML='<div>Alterar tipo apaga os dados.</div><button data-confirm>Confirmar =</button><button data-cancel>Cancelar AC</button>';
  else if(page==='options')root.innerHTML=list(optionItems(),'OPTN');
  else if(page==='results')root.innerHTML=`<div class="stats-result">${results.slice(Math.max(0,selected-3),Math.max(0,selected-3)+4).map((v,i)=>`<div class="${i+Math.max(0,selected-3)===selected?'selected':''}">${esc(v[0])} = ${esc(v[1])}</div>`).join('')}</div><small>AC: voltar aos dados</small>`;
  else {const cols=names();if(row<top)top=row;if(row>top+3)top=row-3;let body='';for(let r=top;r<top+4;r++){body+=`<tr><th>${r+1}</th>`;for(let c=0;c<cols.length;c++)body+=`<td><button data-cell="${r}:${c}" class="${r===row&&c===col?'selected':''}" aria-label="${cols[c]}, linha ${r+1}">${esc(raw(r,c))}</button></td>`;body+='</tr>'}root.innerHTML=`<table><thead><tr><th></th>${cols.map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table><div class="stat-entry">${cols[col]}${row+1}: ${editing?`<input data-edit aria-label="Editar ${cols[col]}, linha ${row+1}" value="${esc(buffer)}" autocomplete="off">`:`<span>${esc(raw(row,col))}</span>`}</div>`}
  if(warning){const n=document.createElement('div');n.className='stat-warning';n.setAttribute('role','status');n.textContent=warning;root.append(n)}
  root.querySelectorAll('[data-list]').forEach(b=>b.addEventListener('click',()=>{selected=+b.dataset.list;choose()}));root.querySelector('[data-confirm]')?.addEventListener('click',confirmType);root.querySelector('[data-cancel]')?.addEventListener('click',()=>{page='options';render()});root.querySelectorAll('[data-cell]').forEach(b=>b.addEventListener('click',()=>{if(editing)commit();[row,col]=b.dataset.cell.split(':').map(Number);render()}));
  const input=root.querySelector('[data-edit]');if(input){input.focus({preventScroll:true});input.setSelectionRange(cursor,cursor);input.addEventListener('input',()=>{buffer=input.value;cursor=input.selectionStart??buffer.length});input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();commit();advance()}else if(e.key==='Escape'){e.preventDefault();cancelEdit()}e.stopPropagation()})}
 }
 function confirmType(){type=TYPES[pendingType][0];typeIndex=pendingType;rows=[];row=col=top=0;editing=false;pendingType=-1;page='data';warning='';render()}
 function choose(){if(page==='types'){const choice=selected;if(rows.some(r=>r.X||r.Y)){pendingType=choice;page='confirm'}else{pendingType=choice;confirmType()}render();return}
  if(page==='options'){const id=optionItems()[selected]?.[0];warning='';if(id==='type'){page='types';selected=typeIndex}else if(id==='data'||id==='back'){page='data'}else if(id==='one'||id==='two'||id==='regression'){calc(id);return}else if(id==='frequency'){frequency=!frequency;col=0;page='data'}else if(id==='insert'){rows.splice(row,0,{X:'',Y:'',Freq:'1'});page='data'}else if(id==='delete'){if(row<rows.length)rows.splice(row,1);page='data'}render()}}
 function commit(){if(!editing)return true;try{if(buffer.trim()){const n=evaluate(buffer.replaceAll(',','.'),options);if(names()[col]==='Freq'&&(!Number.isSafeInteger(n)||n<0))throw Error('Math ERROR');ensure(row);rows[row][names()[col]]=String(n)}else{ensure(row);rows[row][names()[col]]=names()[col]==='Freq'?'1':''}editing=false;warning='';return true}catch{warning='Math ERROR';render();return false}}
 function advance(){if(editing&&!commit())return;row=Math.min(159,row+1);render()}
 function cancelEdit(){editing=false;buffer='';warning='';render()}
 function press(action){if(page==='confirm'){if(action==='equals')confirmType();else if(action==='clear'||action==='left'){page='options';render()}return true}
  if(page==='types'||page==='options'){const items=page==='types'?TYPES:optionItems();if(action==='up'||action==='down'){selected=Math.max(0,Math.min(items.length-1,selected+(action==='up'?-1:1)));render();return true}if(/^[1-9]$/.test(action)){const i=+action-1;if(i<items.length){selected=i;choose()}return true}if(action==='equals'){choose();return true}if(action==='clear'||action==='left'){page==='types'?options.onBack?.():(page='data',render());return true}return false}
  if(page==='results'){if(action==='up'||action==='down'){selected=Math.max(0,Math.min(results.length-1,selected+(action==='up'?-1:1)));render();return true}if(['clear','left','optn'].includes(action)){page='data';render();return true}return false}
  if(action==='optn'){if(editing&&!commit())return true;page='options';selected=0;render();return true}
  if(action==='clear'){if(editing)cancelEdit();else options.onBack?.();return true}
  if(action==='equals'){if(!editing){editing=true;buffer=raw(row,col);cursor=buffer.length;render()}else advance();return true}
  if(['up','down','left','right'].includes(action)){if(editing){if(action==='left'||action==='right'){cursor=Math.max(0,Math.min(buffer.length,cursor+(action==='left'?-1:1)));render();return true}if(!commit())return true}if(action==='up')row=Math.max(0,row-1);if(action==='down')row=Math.min(159,row+1);if(action==='left')col=Math.max(0,col-1);if(action==='right')col=Math.min(names().length-1,col+1);render();return true}
  if(action==='del'){if(!editing){ensure(row);rows[row][names()[col]]=names()[col]==='Freq'?'1':'';render()}else if(cursor){buffer=buffer.slice(0,cursor-1)+buffer.slice(cursor);cursor--;render()}return true}
  const chars={negative:'-',',':',',fraction:'/',sqrt:'sqrt(',square:'^2',power:'^',inverse:'^(-1)',sin:'sin(',cos:'cos(',tan:'tan(',log:'log(',ln:'ln(',exp:'*10^'};const value=chars[action]??action;if(!Object.hasOwn(chars,action)&&!/^\d$/.test(value)&&!['+','-','*','/','(',')'].includes(value))return false;if(!editing){editing=true;buffer='';cursor=0}buffer=buffer.slice(0,cursor)+value+buffer.slice(cursor);cursor+=value.length;render();return true;
 }
 root.addEventListener('keydown',e=>{if(e.target.matches('input'))return;const a=({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'equals',Escape:'clear',Backspace:'del','+':'+','-':'-','*':'*','/':'/', '.':','})[e.key]||(/^\d$/.test(e.key)?e.key:null);if(a){e.preventDefault();e.stopPropagation();press(a)}});
 render();return {element:root,press,focus:()=>root.focus(),destroy:()=>root.remove(),getState:()=>({page,type,frequency,row,col,rows:structuredClone(rows),results:structuredClone(results)})};
}
