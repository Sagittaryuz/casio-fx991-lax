import './style.css';
import './natural-display.css';
import { renderNatural, naturalOffsetAt, fractionTarget } from './natural-display.js';
import { evaluate, formatResult } from './engine.js';
import { exactResult } from './exact.js';
import { openModes } from './modes-ui.js';
import { CalculatorEditor } from './editor.js';

const app = document.querySelector('#app');
const keys = [
  [{t:'OPTN',a:'optn',s:'QR'}, {t:'CALC',a:'calc',s:'SOLVE'}, {t:'∫',a:'integral',s:'d/dx'}, {t:'x',a:'variableX',s:'Σ'}],
  [{t:'▰',a:'fraction',s:'a b/c'}, {t:'√',a:'sqrt',s:'∛'}, {t:'x²',a:'square',s:'x³'}, {t:'xʸ',a:'power',s:'□√'}, {t:'log',a:'log',s:'10ˣ'}, {t:'ln',a:'ln',s:'eˣ'}],
  [{t:'(−)',a:'negative',s:'log'}, {t:'° ′ ″',a:'dms',s:'FACT'}, {t:'x⁻¹',a:'inverse',s:'x!'}, {t:'sin',a:'sin',s:'sin⁻¹'}, {t:'cos',a:'cos',s:'cos⁻¹'}, {t:'tan',a:'tan',s:'tan⁻¹'}],
  [{t:'STO',a:'store',s:'RECALL'}, {t:'ENG',a:'eng',s:'←'}, {t:'(',a:'(' ,s:'Abs'}, {t:')',a:')'}, {t:'S⇔D',a:'toggleExact',s:'a b/c'}, {t:'M+',a:'memory',s:'M−'}],
  [{t:'7',a:'7',s:'CONST'}, {t:'8',a:'8',s:'CONV'}, {t:'9',a:'9',s:'RESET'}, {t:'DEL',a:'del',s:'INS',c:'blue'}, {t:'AC',a:'clear',s:'OFF',c:'blue'}],
  [{t:'4',a:'4'}, {t:'5',a:'5'}, {t:'6',a:'6'}, {t:'×',a:'*',s:'nPr'}, {t:'÷',a:'/',s:'nCr'}],
  [{t:'1',a:'1'}, {t:'2',a:'2'}, {t:'3',a:'3'}, {t:'+',a:'+',s:'Pol'}, {t:'−',a:'-',s:'Rec'}],
  [{t:'0',a:'0',s:'Rnd'}, {t:',',a:',',s:'Ran#'}, {t:'×10ˣ',a:'exp',s:'π'}, {t:'Ans',a:'ans',s:'%'}, {t:'=',a:'equals',s:'≈'}]
];
app.innerHTML = `<main class="stage"><section class="calculator" aria-label="Calculadora científica FX-991LA X"><div class="face"><header class="header"><div class="brand"><strong>CASIO</strong><span>fx-991LA X</span><em>CLASSWIZ</em></div><div class="solar" aria-label="Painel solar decorativo"></div></header><div class="display-bezel"><div class="display"><div class="status"><span id="mode">D</span><span id="modifier"></span><span id="status">CALCULAR</span></div><div class="expression-wrap"><div id="natural-expression" class="natural-expression" aria-hidden="true"></div><input id="expression" aria-label="Expressão" autocomplete="off" spellcheck="false" inputmode="none"></div><output id="result" aria-live="polite">0</output></div></div><div class="control-top"><div class="round-wrap"><span>SHIFT</span><button data-action="shift" class="round" aria-label="Shift"></button></div><div class="round-wrap alpha"><span>ALPHA</span><button data-action="alpha" class="round" aria-label="Alpha"></button></div><div class="direction" aria-label="Edição"><button data-action="left" aria-label="Cursor à esquerda">◀︎</button><div><button data-action="up" aria-label="Acima">▲</button><button data-action="down" aria-label="Abaixo">▼</button></div><button data-action="right" aria-label="Cursor à direita">▶︎</button></div><div class="round-wrap menu"><span>MENU SETUP</span><button data-action="menu" class="round" aria-label="Menu e configuração"></button></div><div class="round-wrap"><span>ON</span><button data-action="on" class="round" aria-label="Ligar"></button></div></div><div id="keyboard" class="keyboard"></div><div class="foot"></div></div></section><p class="caption">Projeto independente · Não é um aplicativo oficial da Casio</p></main>`;
const keyboard=document.querySelector('#keyboard');
const alphaKeys={negative:'A',dms:'B',inverse:'C',sin:'D',cos:'E',tan:'F',')':'x',toggleExact:'y',memory:'M',exp:'e'};
keys.forEach((row,i)=>{const el=document.createElement('div');el.className='key-row row-'+i;row.forEach(k=>{const cell=document.createElement('div');cell.className='key-cell';const small=document.createElement('span');small.className='secondary';small.textContent=k.s||' '; if(alphaKeys[k.a]){const a=document.createElement('span');a.className='alpha-label';a.textContent=alphaKeys[k.a];small.append(' ',a)}const b=document.createElement('button');b.type='button';b.className='key '+(i>=4?'number ':'science ')+(k.c||'');b.textContent=k.t;b.dataset.action=k.a;b.setAttribute('aria-label',k.t+(k.s?' · Shift '+k.s:'')+(alphaKeys[k.a]?' · Alpha '+alphaKeys[k.a]:''));cell.append(small,b);el.append(cell)});keyboard.append(el)});
const field=document.querySelector('#expression'), result=document.querySelector('#result'), mod=document.querySelector('#modifier'), mode=document.querySelector('#mode'), status=document.querySelector('#status');
let shift=false, alpha=false, storing=false, recalling=false, angle='DEG', ans=0, off=false, done=false, exact=null, decimal='0', showExact=false;
const editor=new CalculatorEditor();
const naturalExpression=document.querySelector('#natural-expression');
function refreshExpression(){renderNatural(naturalExpression,field.value,document.activeElement===field?field.selectionStart:null,field.selectionEnd);const caret=naturalExpression.querySelector('.math-caret');if(caret){const bounds=naturalExpression.getBoundingClientRect(),mark=caret.getBoundingClientRect();if(mark.right>bounds.right)naturalExpression.scrollLeft+=mark.right-bounds.right+4;else if(mark.left<bounds.left)naturalExpression.scrollLeft-=bounds.left-mark.left+4;}}
function setResult(value){value=String(value);result.setAttribute('aria-label',value);if(value.includes('/'))renderNatural(result,value);else result.textContent=value;}
function insert(str){if(done){field.value=/^[+*/^\-]$/.test(str)?'Ans':'';field.setSelectionRange(field.value.length,field.value.length);done=false} const start=field.selectionStart??field.value.length, end=field.selectionEnd??start;field.value=field.value.slice(0,start)+str+field.value.slice(end);field.focus();field.setSelectionRange(start+str.length,start+str.length)}
function message(s){status.textContent=s;setTimeout(()=>status.textContent='CALCULAR',2500)}
function press(action){if(off&&action!=='on')return;let shifted=shift, alphad=alpha;if(action!=='shift'&&action!=='alpha'){shift=false;alpha=false;mod.textContent=''}
 if(action==='on'){off=false;document.querySelector('.display').classList.remove('off');return}
 if(action==='shift'){shift=!shift;alpha=false;mod.textContent=shift?'S':'';return}
 if(action==='alpha'){alpha=!alpha;shift=false;mod.textContent=alpha?'A':'';return}
 if((alphad||storing||recalling)&&alphaKeys[action]){const name=alphaKeys[action];if(storing||recalling){if(name==='e'){storing=false;recalling=false;message('VARIÁVEL INVÁLIDA')}else if(storing){editor.store(name,ans);storing=false;message('STO '+name)}else {insert(String(editor.recall(name)).replace('.',','));recalling=false}}else insert(name);return}
 if(action==='store'){storing=!shifted;recalling=shifted;message(shifted?'RECALL: ESCOLHA VARIÁVEL':'STO: ESCOLHA VARIÁVEL');return}
 if(action==='memory'){editor.store('M',editor.recall('M')+(shifted?-ans:ans));message('M = '+formatResult(editor.recall('M')));return}
 if(action==='dms'||action==='optn'||action==='calc'||action==='integral'||action==='eng'){message('NÃO DISPONÍVEL');return}
 if(action==='variableX'){if(shifted){message('NÃO DISPONÍVEL')}else insert('x');return}
 if(action==='menu'){if(shifted){angle=angle==='DEG'?'RAD':'DEG';mode.textContent=angle==='DEG'?'D':'R';message(angle)}else openModes({angle});return}
 if(action==='clear'){storing=false;recalling=false;if(shifted){off=true;document.querySelector('.display').classList.add('off')}else{field.value='';setResult('0');done=false}return}
 if(action==='del'){if(shifted){message('INSERÇÃO ATIVA');return}let start=field.selectionStart??field.value.length,end=field.selectionEnd??start;if(start===end&&start>0)start--;field.value=field.value.slice(0,start)+field.value.slice(end);field.focus();field.setSelectionRange(start,start);return}
 if(action==='up'||action==='down'){const p=field.selectionStart??0;const target=fractionTarget(field.value,p,action);if(target!==null){field.focus();field.setSelectionRange(target,target)}return}
 if(action==='left'||action==='right'){const p=field.selectionStart??0;field.focus();field.setSelectionRange(Math.max(0,Math.min(field.value.length,p+(action==='left'?-1:1))),Math.max(0,Math.min(field.value.length,p+(action==='left'?-1:1))));return}
 if(action==='unsupported'){message('NÃO DISPONÍVEL');return}
 if(action==='toggleExact'){if(shifted){message('NÃO DISPONÍVEL');return}if(exact!==null){showExact=!showExact;setResult(showExact?exact:decimal)}return}
 if(action==='equals'){if(shifted&&done){setResult(decimal);showExact=false;return}try{let expr=field.value.replaceAll(',','.').replaceAll(';',',');const balance=(expr.match(/\(/g)||[]).length-(expr.match(/\)/g)||[]).length;if(balance>0)expr+=')'.repeat(balance);const val=evaluate(expr,{angle,ans,variables:editor.variables,memory:editor.recall('M')});decimal=formatResult(val).replace('.',',');exact=exactResult(expr);showExact=exact!==null;setResult(showExact?exact:decimal);ans=val;done=true}catch(e){setResult('Erro');message('VERIFIQUE A EXPRESSÃO')}return}
 if(['sin','cos','tan'].includes(action)){insert((shifted?'a':'')+action+'(');return}
 if(action==='sqrt'){insert(shifted?'cbrt(':'sqrt(');return}
 if(action==='log'||action==='ln'){insert(shifted?(action==='log'?'10^':'e^'):action+'(');return}
 if(action==='square'){insert(shifted?'^3':'^2');return}
 if(action==='power'){if(shifted)message('NÃO DISPONÍVEL');else insert('^');return} if(action==='inverse'){insert(shifted?'!':'^(-1)');return}
 if(action==='negative'){if(shifted)message('NÃO DISPONÍVEL');else insert('-');return} if(action==='fraction'){if(shifted){message('NÃO DISPONÍVEL');return}insert('()/()');const p=field.selectionStart;field.setSelectionRange(p-4,p-4);return}
 if(action==='exp'){insert(shifted?'pi':'*10^');return} if(action==='ans'){insert(shifted?'%':'Ans');return}
 if(action==='('&&shifted){insert('abs(');return}
 if((action==='*'||action==='/')&&shifted){const previous=done?'Ans':field.value;if(!previous){message('INFORME O PRIMEIRO VALOR');return}field.value=(action==='*'?'npr(':'ncr(')+previous+';';done=false;field.focus();field.setSelectionRange(field.value.length,field.value.length);return}
 if(action===','&&shifted){insert(String(Math.random()).replace('.',','));return}
 if(shifted&&['7','8','9','del','0','+','-','equals'].includes(action)){message('NÃO DISPONÍVEL');return}
 insert(action);
}
app.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b)press(b.dataset.action)});
field.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='='){e.preventDefault();press('equals')}if(e.key==='Escape'){e.preventDefault();press('clear')}});
document.addEventListener('keydown',e=>{if(document.querySelector('.mode-dialog')||e.target===field||e.target.closest('input,textarea,select,[contenteditable=true]')||e.ctrlKey||e.metaKey||e.altKey)return;if(/^[0-9.,+\-*/^()]$/.test(e.key)){e.preventDefault();insert(e.key==='.'?',':e.key)}else if(e.key==='Enter'||e.key==='='){e.preventDefault();press('equals')}else if(e.key==='Backspace'){e.preventDefault();press('del')}else if(e.key==='Escape'){press('clear')}});

if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

field.addEventListener('input',()=>{done=false});
for(const event of ['input','keyup','click','select','focus','blur']) field.addEventListener(event,()=>queueMicrotask(refreshExpression));
app.addEventListener('click',()=>queueMicrotask(refreshExpression));
document.addEventListener('keydown',()=>queueMicrotask(refreshExpression));
refreshExpression();

let touchAnchor=null;
naturalExpression.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();done=false;const p=naturalOffsetAt(naturalExpression,e.clientX,e.clientY);touchAnchor=p;field.focus({preventScroll:true});field.setSelectionRange(p,p);naturalExpression.setPointerCapture(e.pointerId);refreshExpression()});
naturalExpression.addEventListener('pointermove',e=>{if(touchAnchor===null||!naturalExpression.hasPointerCapture(e.pointerId))return;const p=naturalOffsetAt(naturalExpression,e.clientX,e.clientY);field.setSelectionRange(Math.min(touchAnchor,p),Math.max(touchAnchor,p),p<touchAnchor?'backward':'forward');refreshExpression()});
for(const type of ['pointerup','pointercancel','lostpointercapture'])naturalExpression.addEventListener(type,()=>{touchAnchor=null});
