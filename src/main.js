import {renderSegmentText} from './hp-digits.js';
import './style.css';
import './natural-display.css';
import { renderNatural, naturalOffsetAt, fractionTarget } from './natural-display.js';
import { evaluate, formatResult } from './engine.js';
import { exactResult } from './exact.js';
import { openModes, openIconMenu, openSetup, openOptions, resetModes } from './modes-ui.js';
import { createSettings, formatNumber } from './settings.js';
import { SPREADSHEET_STORAGE_KEY } from './spreadsheet.js';
import { CalculatorEditor } from './editor.js';
import {toDMS, primeFactors, engineering, roundToDisplay} from './scientific.js';

const app = document.querySelector('#app');
const keys = [
  [{t:'OPTN',a:'optn',s:'QR'}, {t:'CALC',a:'calc',s:'SOLVE'}, {t:'∫',a:'integral',s:'d/dx'}, {t:'x',a:'variableX',s:'Σ'}],
  [{t:'▰',a:'fraction',s:'a b/c'}, {t:'√',a:'sqrt',s:'∛'}, {t:'x²',a:'square',s:'x³'}, {t:'xʸ',a:'power',s:'□√'}, {t:'log',a:'log',s:'10ˣ'}, {t:'ln',a:'ln',s:'eˣ'}],
  [{t:'(−)',a:'negative',s:'log'}, {t:'° ′ ″',a:'dms',s:'FACT'}, {t:'x⁻¹',a:'inverse',s:'x!'}, {t:'sin',a:'sin',s:'sin⁻¹'}, {t:'cos',a:'cos',s:'cos⁻¹'}, {t:'tan',a:'tan',s:'tan⁻¹'}],
  [{t:'STO',a:'store',s:'RECALL'}, {t:'ENG',a:'eng',s:'←'}, {t:'(',a:'(' ,s:'Abs'}, {t:')',a:')'}, {t:'S⇔D',a:'toggleExact',s:'a b/c'}, {t:'M+',a:'memory',s:'M−'}],
  [{t:'7',a:'7',s:'CONST'}, {t:'8',a:'8',s:'CONV'}, {t:'9',a:'9',s:'RESET'}, {t:'DEL',a:'del',s:'INS',c:'blue',alpha:'UNDO'}, {t:'AC',a:'clear',s:'OFF',c:'blue'}],
  [{t:'4',a:'4'}, {t:'5',a:'5'}, {t:'6',a:'6'}, {t:'×',a:'*',s:'nPr'}, {t:'÷',a:'/',s:'nCr'}],
  [{t:'1',a:'1'}, {t:'2',a:'2'}, {t:'3',a:'3'}, {t:'+',a:'+',s:'Pol'}, {t:'−',a:'-',s:'Rec'}],
  [{t:'0',a:'0',s:'Rnd'}, {t:',',a:',',s:'Ran#'}, {t:'×10ˣ',a:'exp',s:'π'}, {t:'Ans',a:'ans',s:'%'}, {t:'=',a:'equals',s:'≈'}]
];
app.innerHTML = `<main class="stage"><section class="calculator" aria-label="Calculadora científica FX-991LA X"><div class="face"><div class="display-bezel"><div class="display"><div class="status"><span id="mode">D</span><span id="modifier"></span><span id="status">CALCULAR</span></div><div class="expression-wrap"><div id="natural-expression" class="natural-expression" aria-hidden="true"></div><input id="expression" aria-label="Expressão" autocomplete="off" spellcheck="false" inputmode="none"></div><output id="result" aria-live="polite">0</output></div></div><div class="control-top"><div class="round-wrap"><span>SHIFT</span><button data-action="shift" class="round" aria-label="Shift"></button></div><div class="round-wrap alpha"><span>ALPHA</span><button data-action="alpha" class="round" aria-label="Alpha"></button></div><div class="direction" aria-label="Edição"><button data-action="left" aria-label="Cursor à esquerda">◀︎</button><div><button data-action="up" aria-label="Acima">▲</button><button data-action="down" aria-label="Abaixo">▼</button></div><button data-action="right" aria-label="Cursor à direita">▶︎</button></div><div class="round-wrap menu"><span>MENU SETUP</span><button data-action="menu" class="round" aria-label="Menu e configuração"></button></div><div class="round-wrap"><span>ON</span><button data-action="on" class="round" aria-label="Ligar"></button></div></div><div id="keyboard" class="keyboard"></div><div class="foot"></div></div></section><p class="caption">Projeto independente · Não é um aplicativo oficial da Casio</p></main>`;
const keyboard=document.querySelector('#keyboard');
const alphaKeys={negative:'A',dms:'B',inverse:'C',sin:'D',cos:'E',tan:'F',')':'x',toggleExact:'y',memory:'M',exp:'e'};
keys.forEach((row,i)=>{const el=document.createElement('div');el.className='key-row row-'+i;row.forEach(k=>{const cell=document.createElement('div');cell.className='key-cell';const small=document.createElement('span');small.className='secondary';small.textContent=k.s||' '; if(alphaKeys[k.a]||k.a==='calc'||k.alpha){const a=document.createElement('span');a.className='alpha-label';a.textContent=k.alpha||alphaKeys[k.a]||'=';small.append(' ',a)}const b=document.createElement('button');b.type='button';b.className='key '+(i>=4?'number ':'science ')+(k.c||'');b.textContent=k.t;const mathGlyphs={
 fraction:'<svg viewBox="0 0 40 28" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2"><rect x="14" y="2" width="12" height="7"/><path d="M7 13h26"/><rect x="14" y="17" width="12" height="7"/></g></svg>',
 integral:'<svg viewBox="0 0 50 30" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.5"><rect x="17" y="1" width="6" height="5"/><rect x="17" y="24" width="6" height="5"/><rect x="26" y="10" width="9" height="9"/></g><text x="5" y="24" font-family="serif" font-size="26">∫</text><text x="37" y="20" font-family="serif" font-size="12" font-style="italic">dx</text></svg>',
 sqrt:'<svg viewBox="0 0 40 28" aria-hidden="true"><path d="M3 15l5-1 4 8L17 5h19" fill="none" stroke="currentColor" stroke-width="2"/><rect x="20" y="9" width="12" height="11" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>',
 power:'<svg viewBox="0 0 40 28" aria-hidden="true"><text x="6" y="22" font-family="serif" font-size="23" font-style="italic">x</text><rect x="23" y="3" width="10" height="9" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>',
 log:'<svg viewBox="0 0 50 28" aria-hidden="true"><text x="1" y="21" font-family="Arial" font-size="17" font-weight="bold">log</text><rect x="30" y="18" width="7" height="7" fill="none" stroke="currentColor" stroke-width="1.3"/><rect x="39" y="9" width="9" height="10" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>',
 variableX:'<svg viewBox="0 0 32 28" aria-hidden="true"><text x="7" y="23" font-family="serif" font-size="25" font-style="italic">x</text></svg>'
 };if(mathGlyphs[k.a])b.innerHTML=mathGlyphs[k.a];b.dataset.action=k.a;b.setAttribute('aria-label',k.t+(k.s?' · Shift '+k.s:'')+((k.alpha||alphaKeys[k.a])?' · Alpha '+(k.alpha||alphaKeys[k.a]):''));cell.append(small,b);el.append(cell)});keyboard.append(el)});
const field=document.querySelector('#expression'), result=document.querySelector('#result'), mod=document.querySelector('#modifier'), mode=document.querySelector('#mode'), status=document.querySelector('#status');
let shift=false, alpha=false, storing=false, recalling=false, angle='DEG', ans=0, off=false, done=false, exact=null, decimal='0', showExact=false, engStep=0, engActive=false, dmsActive=false, mixedDisplay=false;
const editor=new CalculatorEditor();
const settings=createSettings();
angle=settings.get().angle;mode.textContent=angle==='DEG'?'D':angle==='RAD'?'R':'G';
function applySetup(value,warning){angle=value.angle;mode.textContent=angle==='DEG'?'D':angle==='RAD'?'R':'G';if(done){decimal=formatNumber(ans,value).replace('.',',');if(!showExact)setResult(decimal)}if(warning)message(warning)}
function acceptResult(value,details={}){if(details.variables){for(const [name,v] of Object.entries(details.variables))if(Object.hasOwn(editor.variables,name)&&Number.isFinite(v))editor.store(name,v);if(details.kind==='solve'&&Object.hasOwn(editor.variables,details.variable))editor.store(details.variable,value)}ans=value;decimal=formatNumber(ans,settings.get()).replace('.',',');exact=null;showExact=false;done=true;setResult(decimal)}
function insertConstant(value){const before=snapshot(),text=String(value).replace('.',',');if(done)insert(text);else{const a=field.selectionStart??field.value.length,b=field.selectionEnd??a;const left=field.value[a-1]||'',right=field.value[b]||'';insert((/[0-9A-Za-zπ)]/.test(left)?'*':'')+text+(/[0-9A-Za-zπ(]/.test(right)?'*':''))}remember(before)}
function calcContext(){return {angle,onPowerReset:()=>perform('on'),onOpenSetup:()=>openSetup(settings,{...calcContext(),onApply:applySetup,onResetAll:resetAll}),expression:field.value.replaceAll(',','.').replaceAll(';',','),variables:{...editor.variables},ans,onAccept:(value,details)=>details?.kind==='constant'?insertConstant(value):acceptResult(value,details)}}
function resetAll(){let storageOk=true;try{localStorage.removeItem(SPREADSHEET_STORAGE_KEY)}catch{storageOk=false}resetModes();for(const name of Object.keys(editor.variables))editor.store(name,0);ans=0;field.value='';setResult('0');done=false;exact=null;decimal='0';return storageOk}
const naturalExpression=document.querySelector('#natural-expression');
let lastExpressionView=null;
function refreshExpression(){const cursor=document.activeElement===field?field.selectionStart:null, end=field.selectionEnd;const signature=JSON.stringify([field.value,cursor,end]);if(signature===lastExpressionView)return;lastExpressionView=signature;renderNatural(naturalExpression,field.value,cursor,end);const caret=naturalExpression.querySelector('.math-caret');if(caret){const bounds=naturalExpression.getBoundingClientRect(),mark=caret.getBoundingClientRect();if(mark.right>bounds.right)naturalExpression.scrollLeft+=mark.right-bounds.right+4;else if(mark.left<bounds.left)naturalExpression.scrollLeft-=bounds.left-mark.left+4;}}
function setResult(value){value=String(value);result.setAttribute('aria-label',value);const mixed=value.match(/^([−-]?)(\d+) (\d+)\/(\d+)$/);if(mixed){renderNatural(result,`mix(${mixed[2]};${mixed[3]};${mixed[4]})`);if(mixed[1]){const sign=document.createElement('span');sign.textContent='−';result.prepend(sign)}}else if(value.includes('/'))renderNatural(result,value);else renderSegmentText(result,value);const count=Math.max(10,value.length);result.style.fontSize=`min(clamp(20px, 9cqw, 50px), ${value.includes('/')?'4cqh':'5cqh'}, calc(75cqw / ${count*.62}))`;}
function mixedForm(value){const m=String(value).match(/^([−-]?)(\d+)\/(\d+)$/);if(!m)return value;const n=BigInt(m[2]),d=BigInt(m[3]);if(!d||n<d||n%d===0n)return value;return `${m[1]?'−':''}${n/d} ${n%d}/${d}`}
let undoState=null,pendingNative=null,restoring=false;
function snapshot(){return {expression:field.value,start:field.selectionStart??0,end:field.selectionEnd??0,direction:field.selectionDirection,answer:ans,done,exact,decimal,showExact,mixedDisplay,result:result.getAttribute('aria-label')??result.textContent}}
function restore(v){restoring=true;field.value=v.expression;field.focus({preventScroll:true});field.setSelectionRange(v.start,v.end,v.direction||'none');ans=v.answer;done=v.done;exact=v.exact;decimal=v.decimal;showExact=v.showExact;mixedDisplay=v.mixedDisplay;setResult(v.result);restoring=false;refreshExpression()}
function remember(before){if(!restoring&&(before.expression!==field.value||before.result!==(result.getAttribute('aria-label')??result.textContent)))undoState=before}
function perform(action){const isUndo=action==='del'&&alpha;const before=snapshot();press(action);if(!isUndo&&action!=='on')remember(before)}

function insert(str){if(done){field.value=/^[+*/^\-]$/.test(str)?'Ans':'';field.setSelectionRange(field.value.length,field.value.length);done=false} const start=field.selectionStart??field.value.length, end=field.selectionEnd??start;field.value=field.value.slice(0,start)+str+field.value.slice(end);field.focus();field.setSelectionRange(start+str.length,start+str.length)}
function message(s){status.textContent=s;setTimeout(()=>status.textContent='CALCULAR',2500)}
function press(action){if(off&&action!=='on')return;if(action!=='eng'&&action!=='shift')engActive=false;let shifted=shift, alphad=alpha;if(action!=='shift'&&action!=='alpha'){shift=false;alpha=false;mod.textContent=''}
 if(action==='on'){off=false;document.querySelector('.display').classList.remove('off');try{const storageOk=resetAll();editor.clear();const restored=settings.reset();applySetup(restored.settings,restored.warning);shift=alpha=storing=recalling=false;mod.textContent='';status.textContent=restored.warning||(!storageOk?'NÃO FOI POSSÍVEL APAGAR DADOS SALVOS':'CALCULAR');undoState=pendingNative=null;engStep=0;engActive=dmsActive=mixedDisplay=showExact=false;lastExpressionView=null;refreshExpression()}catch{message('NÃO FOI POSSÍVEL REINICIAR DADOS')}return}
 if(action==='shift'){shift=!shift;alpha=false;mod.textContent=shift?'S':'';return}
 if(action==='alpha'){alpha=!alpha;shift=false;mod.textContent=alpha?'A':'';return}
 if(alphad&&action==='del'){if(undoState){const current=snapshot();restore(undoState);undoState=current}else message('NADA PARA DESFAZER');return}
 if(alphad&&(action==='calc'||action==='equals')){insert('=');return}
 if((alphad||storing||recalling)&&alphaKeys[action]){const name=alphaKeys[action];if(storing||recalling){if(name==='e'){storing=false;recalling=false;message('VARIÁVEL INVÁLIDA')}else if(storing){editor.store(name,ans);storing=false;message('STO '+name)}else {insert(String(editor.recall(name)).replace('.',','));recalling=false}}else insert(name);return}
 if(action==='store'){storing=!shifted;recalling=shifted;message(shifted?'RECALL: ESCOLHA VARIÁVEL':'STO: ESCOLHA VARIÁVEL');return}
 if(action==='memory'){editor.store('M',editor.recall('M')+(shifted?-ans:ans));message('M = '+formatResult(editor.recall('M')));return}
 if(action==='dms'){if(!shifted&&!field.value.trim()&&!done){openModes({...calcContext(),initialMode:'Cálculo',initialOperation:'DMS → decimal',angle,onAccept:acceptResult});return}try{if(!shifted&&dmsActive){setResult(formatNumber(ans,settings.get()).replace('.',','));dmsActive=false;return}if(!done){const expr=field.value.replaceAll(',','.');ans=evaluate(expr,{angle,ans,variables:editor.variables});done=true}if(shifted){const factors=primeFactors(ans);setResult(factors.map(f=>String(f.prime)+(f.exponent>1?'^'+f.exponent:'')).join(' × '))}else{const d=toDMS(ans);setResult((d.negative?'−':'')+d.degrees+'° '+d.minutes+'′ '+Number(d.seconds.toPrecision(8))+'″');dmsActive=true} }catch(e){setResult('Erro');message('MATH ERROR')}return}
 if(action==='eng'){try{if(!done){ans=evaluate(field.value.replaceAll(',','.'),{angle,ans,variables:editor.variables});done=true}if(!engActive){engStep=0;engActive=true}else engStep+=shifted?-1:1;const v=engineering(ans,engStep);setResult(String(Number(v.mantissa.toPrecision(10))).replace('.',',')+'×10^'+v.exponent)}catch(e){setResult('Erro');message('MATH ERROR')}return}
 if(action==='optn'){if(shifted)message('QR INDISPONÍVEL');else openOptions(calcContext());return}
 if(action==='calc'){openModes({...calcContext(),initialMode:shifted?'solve':'calc',expression:field.value.replaceAll(',','.').replaceAll(';',','),variables:{...editor.variables},ans,angle,onAccept:acceptResult});return}
 if(action==='integral'){openModes({...calcContext(),initialMode:'Cálculo',initialOperation:shifted?'Derivada':'Integral definida',expression:field.value.replaceAll(',','.'),angle,onAccept:acceptResult});return}
 if(action==='variableX'){if(shifted)openModes({...calcContext(),initialMode:'Cálculo',initialOperation:'Somatório',expression:field.value.replaceAll(',','.'),angle,onAccept:acceptResult});else insert('x');return}
 if(shifted&&(action==='+'||action==='-')){openModes({...calcContext(),initialMode:'Cálculo',initialOperation:action==='+'?'Pol':'Rec',angle});return}
 if(action==='menu'){if(shifted)openSetup(settings,{...calcContext(),onApply:applySetup,onResetAll:resetAll});else openIconMenu(calcContext());return}
 if(shifted&&(action==='7'||action==='8')){const isConstant=action==='7';openModes({...calcContext(),initialMode:isConstant?'const':'conv',value:done?ans:(field.value||ans),onAccept:(value,details)=>{if(details.kind==='constant')insertConstant(value);else acceptResult(value,details)}});return}
 if(action==='9'&&shifted){openSetup(settings,{...calcContext(),onApply:applySetup,onResetAll:resetAll});return}
 if(action==='clear'){storing=false;recalling=false;if(shifted){off=true;document.querySelector('.display').classList.add('off')}else{field.value='';setResult('0');done=false}return}
 if(action==='del'){if(shifted){message('INSERÇÃO ATIVA');return}let start=field.selectionStart??field.value.length,end=field.selectionEnd??start;if(start===end&&start>0)start--;field.value=field.value.slice(0,start)+field.value.slice(end);field.focus();field.setSelectionRange(start,start);return}
 if(action==='up'||action==='down'){const p=field.selectionStart??0;const target=fractionTarget(field.value,p,action);if(target!==null){field.focus();field.setSelectionRange(target,target)}return}
 if(action==='left'||action==='right'){const p=field.selectionStart??0;field.focus();field.setSelectionRange(Math.max(0,Math.min(field.value.length,p+(action==='left'?-1:1))),Math.max(0,Math.min(field.value.length,p+(action==='left'?-1:1))));return}
 if(action==='unsupported'){message('NÃO DISPONÍVEL');return}
 if(action==='toggleExact'){if(shifted){if(exact!==null){mixedDisplay=!mixedDisplay;showExact=true;setResult(mixedDisplay?mixedForm(exact):exact)}return}if(exact!==null){showExact=!showExact;setResult(showExact?(mixedDisplay?mixedForm(exact):exact):decimal)}return}
 if(action==='equals'){dmsActive=false;if(shifted&&done){setResult(decimal);showExact=false;return}try{let expr=field.value.replaceAll(',','.').replaceAll(';',',');const balance=(expr.match(/\(/g)||[]).length-(expr.match(/\)/g)||[]).length;if(balance>0)expr+=')'.repeat(balance);const val=evaluate(expr,{angle,ans,variables:editor.variables,memory:editor.recall('M')});decimal=formatNumber(val,settings.get()).replace('.',',');exact=exactResult(expr);mixedDisplay=false;showExact=exact!==null;setResult(showExact?exact:decimal);ans=val;done=true}catch(e){setResult('Erro');message('VERIFIQUE A EXPRESSÃO')}return}
 if(['sin','cos','tan'].includes(action)){insert((shifted?'a':'')+action+'(');return}
 if(action==='sqrt'){insert(shifted?'cbrt(':'sqrt(');return}
 if(action==='log'||action==='ln'){insert(shifted?(action==='log'?'10^':'e^'):action+'(');return}
 if(action==='square'){insert(shifted?'^3':'^2');return}
 if(action==='power'){if(shifted){insert('nthroot(; )');const p=field.selectionStart;field.setSelectionRange(p-3,p-3)}else insert('^');return} if(action==='inverse'){insert(shifted?'!':'^(-1)');return}
 if(action==='negative'){if(shifted){insert('logbase(; )');const p=field.selectionStart;field.setSelectionRange(p-3,p-3)}else insert('-');return} if(action==='fraction'){if(shifted){insert('mix(;;)');const p=field.selectionStart;field.setSelectionRange(p-3,p-3);return}insert('()/()');const p=field.selectionStart;field.setSelectionRange(p-4,p-4);return}
 if(action==='exp'){insert(shifted?'pi':'*10^');return} if(action==='ans'){insert(shifted?'%':'Ans');return}
 if(action==='('&&shifted){insert('abs(');return}
 if((action==='*'||action==='/')&&shifted){const previous=done?'Ans':field.value;if(!previous){message('INFORME O PRIMEIRO VALOR');return}field.value=(action==='*'?'npr(':'ncr(')+previous+';';done=false;field.focus();field.setSelectionRange(field.value.length,field.value.length);return}
 if(action===','&&shifted){insert(String(Math.random()).replace('.',','));return}
 if(action==='0'&&shifted){try{const cfg=settings.get();ans=roundToDisplay(ans,cfg.format,cfg.format==='NORM'?10:cfg.format==='SCI'?(cfg.digits||10):cfg.digits);decimal=formatNumber(ans,cfg).replace('.',',');exact=null;showExact=false;setResult(decimal);done=true}catch(e){setResult('Erro')}return}
 if(shifted&&['7','8','9','del','+','-','equals'].includes(action)){message('NÃO DISPONÍVEL');return}
 insert(action);
}
app.addEventListener('click',e=>{const b=e.target.closest('button[data-action]');if(b)perform(b.dataset.action)});
field.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key==='='){e.preventDefault();perform('equals')}if(e.key==='Escape'){e.preventDefault();perform('clear')}});
document.addEventListener('keydown',e=>{if(document.querySelector('.mode-dialog')||e.target===field||e.target.closest('input,textarea,select,[contenteditable=true]')||e.ctrlKey||e.metaKey||e.altKey)return;if(/^[0-9.,+\-*/^()]$/.test(e.key)){e.preventDefault();const before=snapshot();insert(e.key==='.'?',':e.key);remember(before)}else if(e.key==='Enter'||e.key==='='){e.preventDefault();perform('equals')}else if(e.key==='Backspace'){e.preventDefault();perform('del')}else if(e.key==='Escape'){perform('clear')}});

if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));

field.addEventListener('beforeinput',()=>{if(!restoring)pendingNative=snapshot()});
field.addEventListener('input',()=>{done=false;if(pendingNative){remember(pendingNative);pendingNative=null}});
let expressionRefreshQueued=false;
function queueExpressionRefresh(){if(expressionRefreshQueued)return;expressionRefreshQueued=true;queueMicrotask(()=>{expressionRefreshQueued=false;refreshExpression()})}
for(const event of ['input','keyup','click','select','focus','blur']) field.addEventListener(event,queueExpressionRefresh);
app.addEventListener('click',queueExpressionRefresh);
document.addEventListener('keydown',queueExpressionRefresh);
setResult('0');refreshExpression();

let touchAnchor=null;
naturalExpression.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();done=false;const p=naturalOffsetAt(naturalExpression,e.clientX,e.clientY);touchAnchor=p;field.focus({preventScroll:true});field.setSelectionRange(p,p);naturalExpression.setPointerCapture(e.pointerId);refreshExpression()});
naturalExpression.addEventListener('pointermove',e=>{if(touchAnchor===null||!naturalExpression.hasPointerCapture(e.pointerId))return;const p=naturalOffsetAt(naturalExpression,e.clientX,e.clientY);field.setSelectionRange(Math.min(touchAnchor,p),Math.max(touchAnchor,p),p<touchAnchor?'backward':'forward');refreshExpression()});
for(const type of ['pointerup','pointercancel','lostpointercapture'])naturalExpression.addEventListener(type,()=>{touchAnchor=null});

const controlTop=document.querySelector('.control-top'), directionPad=controlTop.querySelector('.direction');
let directionFrame=0;function alignDirection(){cancelAnimationFrame(directionFrame);directionFrame=requestAnimationFrame(()=>{const upper=controlTop.querySelector('[data-action=shift]').getBoundingClientRect(),lower=keyboard.querySelector('[data-action=optn]').getBoundingClientRect(),control=controlTop.getBoundingClientRect(),pad=directionPad.getBoundingClientRect();const midpoint=(upper.top+upper.height/2+lower.top+lower.height/2)/2;directionPad.style.top=`${midpoint-control.top-pad.height/2}px`;});}
const controlResize=new ResizeObserver(alignDirection);controlResize.observe(document.querySelector('.calculator'));window.addEventListener('resize',alignDirection);alignDirection();
