import * as L from './linear.js';
import { evaluate } from './engine.js';
import './ui-linear.css';

const displayNumber = value => Number(value.toPrecision(10)).toString().replace('.', ',');
const complexText = z => {
  const re = Math.abs(z.re) < 1e-11 ? 0 : z.re;
  const im = Math.abs(z.im) < 1e-11 ? 0 : z.im;
  if (!im) return displayNumber(re);
  const magnitude = Math.abs(im) === 1 ? '' : displayNumber(Math.abs(im));
  return `${re ? displayNumber(re) : ''}${im < 0 ? ' − ' : re ? ' + ' : ''}${magnitude}i`;
};
const option = (value, label) => `<option value="${value}">${label}</option>`;
const numeric = element => {
  const value = element.value.trim();
  if (!value) throw Error('Preencha todos os campos.');
  return evaluate(value.replaceAll(',', '.'));
};

/** Renderiza um modo. mode: 'matrix'/'matriz', 'vector'/'vetor' ou 'equation'/'equação'.
 * Retorna press(action), para encaminhar teclas da calculadora ao campo ativo, e destroy(). */
export function mountLinear(container, mode, options = {}) {
  const names = {matriz:'matrix', vetor:'vector', 'equação':'equation', equacao:'equation'};
  mode = names[String(mode).toLowerCase()] || String(mode).toLowerCase();
  if (!['matrix','vector','equation'].includes(mode)) throw Error('Modo desconhecido');
  let lastInput = null;
  const dimensionOptions = (min,max,selected) => Array.from({length:max-min+1},(_,i)=>min+i).map(n=>`<option value="${n}"${n===selected?' selected':''}>${n}</option>`).join('');
  const base = {
    matrix: `<label>Operação <select data-op>${option('add','A + B')}${option('subtract','A − B')}${option('multiply','A × B')}${option('det','Determinante de A')}${option('inverse','Inversa de A')}${option('transpose','Transposta de A')}</select></label><div class="lin-dimensions"><label>Linhas A <select data-dim="ar">${dimensionOptions(1,4,2)}</select></label><label>Colunas A <select data-dim="ac">${dimensionOptions(1,4,2)}</select></label><label data-b-dim>Linhas B <select data-dim="br">${dimensionOptions(1,4,2)}</select></label><label data-b-dim>Colunas B <select data-dim="bc">${dimensionOptions(1,4,2)}</select></label></div>`,
    vector: `<label>Operação <select data-op>${option('add','A + B')}${option('subtract','A − B')}${option('dot','Produto escalar A · B')}${option('cross','Produto vetorial A × B')}${option('norm','Módulo de A')}${option('unit','Vetor unitário de A')}${option('angle','Ângulo entre A e B')}</select></label><label>Dimensões <select data-dim="n">${dimensionOptions(2,3,3)}</select></label><label data-angle>Unidade angular <select data-unit>${option('DEG','Graus')}${option('RAD','Radianos')}${option('GRAD','Grados')}</select></label>`,
    equation: `<label>Tipo <select data-op>${option('system','Sistema de equações')}${option('polynomial','Polinômio')}</select></label><label data-system-dim>Incógnitas <select data-dim="n">${dimensionOptions(2,4,2)}</select></label><label data-poly-dim>Grau <select data-dim="degree">${dimensionOptions(2,4,2)}</select></label>`
  };
  container.innerHTML = `<section class="linear-ui" aria-label="${mode==='matrix'?'Matriz':mode==='vector'?'Vetor':'Equação'}">${base[mode]}<div data-fields></div><button type="button" data-calculate>Calcular</button><div class="linear-result" data-output role="status" aria-live="polite"></div></section>`;
  const section=container.querySelector('.linear-ui'), fields=section.querySelector('[data-fields]'), op=section.querySelector('[data-op]'), output=section.querySelector('[data-output]');
  if (mode === 'vector' && ['DEG','RAD','GRAD'].includes(options.angle)) section.querySelector('[data-unit]').value=options.angle;
  const dim=name=>Number(section.querySelector(`[data-dim="${name}"]`).value);
  const input=(name,label)=>`<input type="text" inputmode="decimal" data-cell="${name}" aria-label="${label}" value="0" autocomplete="off" spellcheck="false">`;
  const grid=(name,rows,cols,title)=>`<fieldset><legend>${title}</legend><div class="linear-grid" style="--columns:${cols}">${Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>input(`${name}-${r}-${c}`,`${title}, linha ${r+1}, coluna ${c+1}`)).join('')).join('')}</div></fieldset>`;
  function render(){
    const old=Object.fromEntries([...fields.querySelectorAll('[data-cell]')].map(el=>[el.dataset.cell,el.value]));
    const operation=op.value;
    if(mode==='matrix'){
      const binary=['add','subtract','multiply'].includes(operation);
      section.querySelectorAll('[data-b-dim]').forEach(el=>el.hidden=!binary);
      fields.innerHTML=grid('a',dim('ar'),dim('ac'),'Matriz A')+(binary?grid('b',dim('br'),dim('bc'),'Matriz B'):'');
    } else if(mode==='vector'){
      const binary=['add','subtract','dot','cross','angle'].includes(operation);
      section.querySelector('[data-angle]').hidden=operation!=='angle';
      fields.innerHTML=grid('a',1,dim('n'),'Vetor A')+(binary?grid('b',1,dim('n'),'Vetor B'):'');
    } else if(operation==='system'){
      section.querySelector('[data-system-dim]').hidden=false;section.querySelector('[data-poly-dim]').hidden=true;
      const n=dim('n');
      fields.innerHTML=`<fieldset><legend>Coeficientes e termos independentes</legend><div class="linear-grid" style="--columns:${n+1}">${Array.from({length:n},(_,r)=>Array.from({length:n},(_,c)=>input(`a-${r}-${c}`,`Equação ${r+1}, coeficiente da incógnita ${c+1}`)).join('')+input(`b-${r}-0`,`Equação ${r+1}, termo independente`)).join('')}</div></fieldset><p>Cada linha representa uma equação; a última coluna contém o resultado.</p>`;
    } else {
      section.querySelector('[data-system-dim]').hidden=true;section.querySelector('[data-poly-dim]').hidden=false;
      const n=dim('degree');fields.innerHTML=`<fieldset><legend>Coeficientes de x<sup>${n}</sup> até o termo constante</legend><div class="linear-grid" style="--columns:${n+1}">${Array.from({length:n+1},(_,c)=>input(`p-0-${c}`,`Coeficiente de grau ${n-c}`)).join('')}</div></fieldset><p>Os coeficientes são informados em ordem decrescente.</p>`;
    }
    for(const el of fields.querySelectorAll('[data-cell]')) if(Object.hasOwn(old,el.dataset.cell)) el.value=old[el.dataset.cell];
    lastInput=null;output.textContent='';
  }
  function getGrid(name,rows,cols){return Array.from({length:rows},(_,r)=>Array.from({length:cols},(_,c)=>numeric(fields.querySelector(`[data-cell="${name}-${r}-${c}"]`))));}
  function calculate(){
    try {
      const operation=op.value; let answer;
      if(mode==='matrix'){
        const a=getGrid('a',dim('ar'),dim('ac')); const b=['add','subtract','multiply'].includes(operation)?getGrid('b',dim('br'),dim('bc')):null;
        answer=operation==='add'?L.matrixAdd(a,b):operation==='subtract'?L.matrixSubtract(a,b):operation==='multiply'?L.matrixMultiply(a,b):operation==='det'?L.determinant(a):operation==='inverse'?L.matrixInverse(a):L.matrixTranspose(a);
      } else if(mode==='vector'){
        const a=getGrid('a',1,dim('n'))[0], b=['add','subtract','dot','cross','angle'].includes(operation)?getGrid('b',1,dim('n'))[0]:null;
        answer=operation==='add'?L.vectorAdd(a,b):operation==='subtract'?L.vectorSubtract(a,b):operation==='dot'?L.vectorDot(a,b):operation==='cross'?L.vectorCross(a,b):operation==='norm'?L.vectorNorm(a):operation==='unit'?L.vectorUnit(a):L.vectorAngle(a,b,section.querySelector('[data-unit]').value);
      } else if(operation==='system') {
        const n=dim('n'), a=getGrid('a',n,n), b=getGrid('b',n,1).map(row=>row[0]); answer=L.solveSystem(a,b).map((v,i)=>`x${i+1} = ${displayNumber(v)}`).join('\n');
      } else {
        answer=L.polynomialRoots(getGrid('p',1,dim('degree')+1)[0]).map((z,i)=>`x${i+1} = ${complexText(z)}`).join('\n');
      }
      output.textContent=typeof answer==='number'?displayNumber(answer):typeof answer==='string'?answer:Array.isArray(answer[0])?answer.map(row=>row.map(displayNumber).join('   ')).join('\n'):answer.map(displayNumber).join('   ');
    } catch(e) {output.textContent=`Erro: ${e.message}`;}
  }
  section.addEventListener('change',e=>{if(e.target.matches('select'))render();});
  section.addEventListener('focusin',e=>{if(e.target.matches('[data-cell]'))lastInput=e.target;});
  section.addEventListener('keydown',e=>{
    if(!e.target.matches('[data-cell]'))return;
    e.stopPropagation();
    const cells=[...fields.querySelectorAll('[data-cell]')], current=cells.indexOf(e.target);
    if(e.key==='Enter'||e.key==='ArrowDown'||e.key==='ArrowUp'){
      e.preventDefault();const next=e.key==='ArrowUp'?current-1:current+1;
      if(next>=0&&next<cells.length) cells[next].focus();else if(e.key==='Enter')calculate();
    }
  });
  section.querySelector('[data-calculate]').addEventListener('click',calculate);
  render();
  return {
    press(action){
      if(action==='equals'){calculate();return true;}
      const cells=[...fields.querySelectorAll('[data-cell]')];
      if(!lastInput||!cells.includes(lastInput))lastInput=cells[0];
      if(!lastInput)return false;
      if(action==='up'||action==='down'||action==='left'||action==='right'){
        const current=cells.indexOf(lastInput), next=current+(['up','left'].includes(action)?-1:1);if(cells[next])cells[next].focus();return true;
      }
      const start=lastInput.selectionStart??lastInput.value.length,end=lastInput.selectionEnd??start;
      if(action==='del'){const at=start===end?Math.max(0,start-1):start;lastInput.value=lastInput.value.slice(0,at)+lastInput.value.slice(end);lastInput.focus();lastInput.setSelectionRange(at,at);return true;}
      if(action==='clear'){lastInput.value='';lastInput.focus();return true;}
      const character=({'×':'*','÷':'/','−':'-','decimal':','})[action]||action;
      if(!/^[0-9.,+*/^()\-]$/.test(character))return false;
      lastInput.value=lastInput.value.slice(0,start)+character+lastInput.value.slice(end);lastInput.focus();lastInput.setSelectionRange(start+character.length,start+character.length);return true;
    },
    destroy(){container.replaceChildren();}
  };
}
