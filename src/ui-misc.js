/** User-facing mode editors. All arithmetic delegates to the numerical modules. */
import {complexOperation, complexPolar, complexFromPolar, baseConvert, baseOperation, baseNot, solveProportion, solveInequality} from './modes.js';
import {derivative, integral, summation} from './calculus.js';
import {polar, rectangular, fromDMS} from './scientific.js';
import './ui-misc.css';

const number = value => {
  const text=String(value).trim().replace(',', '.');
  if(!text) throw Error('Preencha todos os campos');
  const result=Number(text);
  if(!Number.isFinite(result)) throw Error('Número inválido');
  return result;
};
const expression = value => value.replace(/(\d),(?=\d)/g, '$1.');
const fmt = n => {
  if(!Number.isFinite(n)) throw Error('Resultado inválido');
  if(Math.abs(n)<1e-12) n=0;
  return Number(n.toPrecision(10)).toString().replace('.',',');
};
const complex = z => `${fmt(z.re)} ${z.im<0?'−':'+'} ${fmt(Math.abs(z.im))}i`;
const interval = r => r.length ? r.map(x => {
  if(x.lower!==null&&x.lower===x.upper) return `{${fmt(x.lower)}}`;
  return `${x.lowerInclusive?'[':'('}${x.lower===null?'−∞':fmt(x.lower)}; ${x.upper===null?'+∞':fmt(x.upper)}${x.upperInclusive?']':')'}`;
}).join(' ∪ ') : '∅';
const input = (key,label,value='',extra={}) => ({key,label,value,...extra});
const select = (key,label,value,choices) => ({key,label,value,choices});
const angle = () => select('angle','Unidade angular','DEG',[['DEG','Graus'],['RAD','Radianos'],['GRAD','Grados']]);
const base = key => select(key,key==='from'?'Base de origem':key==='to'?'Base de destino':'Base',key==='to'?'16':'2', [['2','BIN'],['8','OCT'],['10','DEC'],['16','HEX']]);
const modeDefs = {
  'Cálculo': {
    'DMS → decimal': {fields:[select('sign','Sinal','+',[['+','+'],['-','−']]),input('degrees','Graus','12'),input('minutes','Minutos','30'),input('seconds','Segundos','0')],run:v=>fromDMS(number(v.degrees),number(v.minutes),number(v.seconds),v.sign==='-')},
    'Pol': {fields:[input('x','x','3'),input('y','y','4'),angle()],run:v=>({kind:'polar',...polar(number(v.x),number(v.y),v.angle)})},
    'Rec': {fields:[input('r','r','5'),input('theta','θ','53,13010235'),angle()],run:v=>({kind:'rectangular',...rectangular(number(v.r),number(v.theta),v.angle)})},
    'Derivada': {fields:[input('expr','f(x)','4*x^2-5*x'),input('x','Valor de x','0,2'),angle()], run:v=>derivative(expression(v.expr),number(v.x),{angle:v.angle})},
    'Integral definida': {fields:[input('expr','f(x)','1/x'),input('a','Limite inferior','2'),input('b','Limite superior','5'),angle()], run:v=>integral(expression(v.expr),number(v.a),number(v.b),{angle:v.angle})},
    'Somatório': {fields:[input('expr','Expressão em x','x^2+1'),input('a','De','-3'),input('b','Até','7'),angle()], run:v=>summation(expression(v.expr),number(v.a),number(v.b),{angle:v.angle})}
  },
  'Complexos': {
    'Operações': {fields:[input('a','Primeiro número (a + bi)','2+3i'),select('op','Operação','+',[['+','+'],['-','−'],['*','×'],['/','÷']]),input('b','Segundo número (a + bi)','5-7i')],run:v=>complex(complexOperation(v.a.replaceAll(',','.'),v.op,v.b.replaceAll(',','.')))},
    'Retangular → polar': {fields:[input('a','Número (a + bi)','3+4i'),angle()],run:v=>{const r=complexPolar(v.a.replaceAll(',','.'),v.angle);return `${fmt(r.radius)} ∠ ${fmt(r.angle)}${v.angle==='DEG'?'°':v.angle==='GRAD'?' gon':' rad'}`;}},
    'Polar → retangular': {fields:[input('r','Módulo r','5'),input('theta','Ângulo θ','53,13010235'),angle()],run:v=>complex(complexFromPolar(number(v.r),number(v.theta),v.angle))}
  },
  'Base-N': {
    'Converter': {fields:[input('a','Valor','1010',{inputmode:'text'}),base('from'),base('to')],run:v=>baseConvert(v.a,number(v.from),number(v.to))},
    'Operar': {fields:[base('base'),input('a','Primeiro valor','1010',{inputmode:'text'}),select('op','Operação','+',[['+','+'],['-','−'],['*','×'],['/','÷'],['and','AND'],['or','OR'],['xor','XOR'],['xnor','XNOR']]),input('b','Segundo valor','1',{inputmode:'text'})],run:v=>baseOperation(v.a,v.op,v.b,number(v.base))},
    'Complemento NOT': {fields:[base('base'),input('a','Valor','1010',{inputmode:'text'})],run:v=>baseNot(v.a,number(v.base))}
  },
  'Proporção': {
    'A : B = C : D': {fields:[input('a','A','2'),input('b','B','3'),select('missing','Incógnita','D',[['C','C'],['D','D']]),input('value','Valor conhecido (C ou D)','4')],run:v=>`${v.missing} = ${fmt(solveProportion(number(v.a),number(v.b),number(v.value),v.missing))}`}
  },
  'Desigualdade': {
    'Polinômio': {fields:[input('a4','Coeficiente de x⁴','0'),input('a3','Coeficiente de x³','0'),input('a2','Coeficiente de x²','1'),input('a1','Coeficiente de x','0'),input('a0','Termo constante','-1'),select('relation','Relação','>=',[['<','< 0'],['<=','≤ 0'],['>','> 0'],['>=','≥ 0']])],run:v=>{const coeffs=['a4','a3','a2','a1','a0'].map(k=>number(v[k]));return interval(solveInequality(coeffs,v.relation));}}
  }
};

/** Render a mode editor. `mode` is one of Cálculo, Complexos, Base-N, Proporção, Desigualdade. */
export function mountMisc(container, mode, options={}) {
  if(!container || !modeDefs[mode]) throw Error('Modo inválido');
  container.replaceChildren();
  const wrapper=document.createElement('section'); wrapper.className='misc-editor';
  const operationLabel=document.createElement('label'); operationLabel.className='misc-field'; operationLabel.textContent='Operação';
  const operation=document.createElement('select'); operation.dataset.miscOperation='';
  for(const name of Object.keys(modeDefs[mode])) {const o=document.createElement('option');o.value=name;o.textContent=name;operation.append(o);}
  operationLabel.append(operation);wrapper.append(operationLabel);
  const fields=document.createElement('div'); fields.className='misc-fields'; wrapper.append(fields);
  const button=document.createElement('button');button.type='button';button.className='misc-calculate';button.textContent='Calcular';wrapper.append(button);
  const out=document.createElement('output');out.className='misc-output';out.setAttribute('aria-live','polite');out.dataset.miscResult='';wrapper.append(out);
  const apply=document.createElement('button');apply.type='button';apply.textContent='Usar resultado';apply.hidden=true;apply.disabled=true;wrapper.append(apply);container.append(wrapper);let accepted=null,acceptedDetails=null;
  function render(){
    fields.replaceChildren();out.textContent='';accepted=null;acceptedDetails=null;apply.hidden=true;apply.disabled=true;
    for(const item of modeDefs[mode][operation.value].fields){
      const label=document.createElement('label');label.className='misc-field';label.append(document.createTextNode(item.label));
      let control;
      if(item.choices){control=document.createElement('select'); for(const [value,name] of item.choices){const option=document.createElement('option');option.value=value;option.textContent=name;control.append(option);} control.value=item.key==='angle'&&options.angle?options.angle:item.value;}
      else {control=document.createElement('input');control.type='text';control.inputMode=item.inputmode || (/expr|coeffs/.test(item.key)?'text':'decimal');control.value=item.value;control.autocomplete='off';}
      control.name=item.key; control.dataset.miscField=item.key; label.append(control);
      if(item.hint){const hint=document.createElement('small');hint.textContent=item.hint;label.append(hint);}
      fields.append(label);
    }
  }
  function run(){try{const values=Object.fromEntries([...fields.querySelectorAll('input,select')].map(e=>[e.name,e.value]));const answer=modeDefs[mode][operation.value].run(values);if(answer?.kind==='polar'){out.textContent=`r = ${fmt(answer.radius)}, θ = ${fmt(answer.angle)}`;accepted=answer.radius;acceptedDetails={kind:'polar',variables:{x:answer.radius,y:answer.angle}}}else if(answer?.kind==='rectangular'){out.textContent=`x = ${fmt(answer.x)}, y = ${fmt(answer.y)}`;accepted=answer.x;acceptedDetails={kind:'rectangular',variables:{x:answer.x,y:answer.y}}}else{out.textContent=typeof answer==='number'?fmt(answer):answer;accepted=mode==='Cálculo'&&typeof answer==='number'&&Number.isFinite(answer)?answer:null;acceptedDetails={kind:'calculus'}};apply.hidden=accepted===null||!options.onAccept;apply.disabled=apply.hidden;}catch(e){accepted=null;apply.hidden=true;apply.disabled=true;out.textContent=`Erro: ${e.message==='Math ERROR'?'verifique os valores e o domínio':e.message==='Syntax ERROR'?'expressão inválida':e.message}`;}}
  apply.addEventListener('click',()=>{if(accepted!==null)options.onAccept?.(accepted,acceptedDetails)});
  operation.addEventListener('change',render); button.addEventListener('click',run);
  wrapper.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();run();}});
  render();return {element:wrapper,calculate:run,setOperation(name,expr){if(!Object.hasOwn(modeDefs[mode],name))return;operation.value=name;render();if(expr){const f=fields.querySelector('[name=expr]');if(f)f.value=expr}}};
}
