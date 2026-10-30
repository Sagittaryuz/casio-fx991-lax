import * as L from './linear.js';
import * as S from './statistics.js';
import * as M from './modes.js';
import * as C from './calculus.js';
import { Spreadsheet } from './spreadsheet.js';
const Sheet = { calculate(cells) { const sheet=new Spreadsheet(); for(const [address,value] of Object.entries(cells)) sheet.set(address,String(value)); return Object.fromEntries(Object.keys(cells).map(address=>[address,sheet.value(address)])); } };

// Each example is a JSON argument list, making dimensions explicit and editable.
const modes = [
 ['Cálculo','Derivada','derivative',['4*x^2-5*x',0.2],C],
 ['Cálculo','Integral','integral',['1/x',2,5],C],
 ['Cálculo','Somatório','summation',['x^2+1',-3,7],C],
 ['Complexos','Soma','complexOperation',['2+3i','+','5-7i'],M],
 ['Complexos','Produto','complexOperation',['3-2i','*','5+6i'],M],
 ['Complexos','Forma polar','complexPolar',['3+4i','DEG'],M],
 ['Base-N','Conversão','baseConvert',['1010',2,16],M],
 ['Base-N','Operação','baseOperation',['1010','+','1',2],M],
 ['Matriz','Soma','matrixAdd',[[[1,2],[3,4]],[[5,6],[7,8]]],L],
 ['Matriz','Subtração','matrixSubtract',[[[1,2],[3,4]],[[5,6],[7,8]]],L],
 ['Matriz','Produto','matrixMultiply',[[[1,2],[3,4]],[[5,6],[7,8]]],L],
 ['Matriz','Determinante','determinant',[[[1,2],[3,4]]],L],
 ['Matriz','Inversa','matrixInverse',[[[1,2],[3,4]]],L],
 ['Matriz','Transposta','matrixTranspose',[[[1,2],[3,4]]],L],
 ['Vetor','Soma','vectorAdd',[[1,2,3],[4,5,6]],L],
 ['Vetor','Produto escalar','vectorDot',[[1,2,3],[4,5,6]],L],
 ['Vetor','Produto vetorial','vectorCross',[[1,2,3],[4,5,6]],L],
 ['Vetor','Norma','vectorNorm',[[3,4]],L],
 ['Vetor','Ângulo','vectorAngle',[[1,0],[0,1],'DEG'],L],
 ['Estatística','Uma variável','oneVariable',[[1,2,3,4,5]],S],
 ['Estatística','Duas variáveis','twoVariable',[[[1,2],[2,4],[3,6]]],S],
 ['Estatística','Regressão','regression',[[[1,2],[2,4],[3,6]],'linear'],S],
 ['Distribuição','Normal acumulada','normalCDF',[1.96,0,1],S],
 ['Distribuição','Normal intervalo','normalInterval',[-1.96,1.96,0,1],S],
 ['Distribuição','Normal inversa','inverseNormal',[0.975,0,1],S],
 ['Distribuição','Binomial','binomialPDF',[2,5,0.5],S],
 ['Distribuição','Binomial acumulada','binomialCDF',[2,5,0.5],S],
 ['Distribuição','Poisson','poissonPDF',[2,3],S],
 ['Distribuição','Poisson acumulada','poissonCDF',[2,3],S],
 ['Planilha','Calcular células','calculate',[{A1:'40',B1:'=A1*29.5735',C1:'=MEAN(A1:B1)'}],Sheet],
 ['Tabela','f(x), g(x)','makeTable',['x^2','x+1',0,5,1],M],
 ['Equação','Sistema linear','solveSystem',[[[2,1],[1,-1]],[5,1]],L],
 ['Equação','Polinômio','polynomialRoots',[[1,-3,2]],L],
 ['Desigualdade','Polinômio','solveInequality',[[1,0,-1],'>='],M],
 ['Proporção','A:B = C:X','solveProportion',[2,3,4,'D'],M],
];
export function openModes(){
 const dialog=document.createElement('dialog'); dialog.className='mode-dialog';
 dialog.innerHTML='<form method="dialog" class="mode-head"><strong>MENU · MODOS CIENTÍFICOS</strong><button aria-label="Fechar">×</button></form><label>Operação<select id="mode-operation"></select></label><label>Argumentos <small>(formato JSON; ponto decimal)</small><textarea id="mode-args" rows="5" spellcheck="false"></textarea></label><button type="button" id="mode-run">Calcular</button><pre id="mode-output" aria-live="polite"></pre><p>Vetores: [1,2,3] · Matrizes: [[1,2],[3,4]]</p>';
 document.body.append(dialog); const select=dialog.querySelector('select'), args=dialog.querySelector('textarea'), out=dialog.querySelector('pre');
 let group; modes.forEach((m,i)=>{if(!group||group.label!==m[0]){group=document.createElement('optgroup');group.label=m[0];select.append(group)}const option=document.createElement('option');option.value=i;option.textContent=m[1];group.append(option)});
 const setup=()=>{args.value=JSON.stringify(modes[select.value][3]);out.textContent=''};select.addEventListener('change',setup);setup();
 dialog.querySelector('#mode-run').addEventListener('click',()=>{try{const m=modes[select.value], values=JSON.parse(args.value);if(!Array.isArray(values))throw Error('Use uma lista de argumentos'); const result=m[4][m[2]](...values);out.textContent=JSON.stringify(result, (key,value)=>typeof value==='number'?Number(value.toPrecision(10)):value, 2)}catch(e){out.textContent='Erro: '+e.message}});
 dialog.addEventListener('close',()=>dialog.remove());dialog.showModal();
}
