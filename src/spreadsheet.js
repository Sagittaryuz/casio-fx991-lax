/** Small 5-by-45 spreadsheet model. Pure data model; no DOM. */
import {evaluate} from './engine.js';
const CELL=/^([A-E])(\d+)$/;
const REF=/(?<![A-Za-z0-9_])(\$?)([A-E])(\$?)(\d+)(?![A-Za-z0-9_])/gi;
function coordinate(address) {
  const m=String(address).toUpperCase().match(CELL);
  if(!m||Number(m[2])<1||Number(m[2])>45) throw Error('Invalid cell');
  return {col:m[1].charCodeAt(0)-65,row:Number(m[2])};
}
function address(col,row) {if(col<0||col>4||row<1||row>45)throw Error('Invalid cell');return String.fromCharCode(65+col)+row;}
function references(a,b) {
  const x=coordinate(a), y=coordinate(b), cells=[];
  for(let row=Math.min(x.row,y.row);row<=Math.max(x.row,y.row);row++)
    for(let col=Math.min(x.col,y.col);col<=Math.max(x.col,y.col);col++)cells.push(address(col,row));
  return cells;
}
export class Spreadsheet {
  constructor(options={}) {this.cells=new Map();this.options=options;}
  set(cell,content) {
    cell=cell.toUpperCase();coordinate(cell); const raw=String(content).trim();
    if(raw==='') this.cells.delete(cell); else this.cells.set(cell,raw);
  }
  get(cell) {cell=cell.toUpperCase();coordinate(cell);return this.cells.get(cell)??'';}
  clear(cell) {this.set(cell,'');}
  value(cell) {return this.#resolve(String(cell).toUpperCase(),new Set());}
  #resolve(cell,active) {
    coordinate(cell); if(active.has(cell))throw Error('Circular reference');
    const raw=this.get(cell); if(!raw)return 0;
    active.add(cell);
    try {
      if(!raw.startsWith('=')) {const v=Number(raw);if(!Number.isFinite(v))throw Error('Syntax ERROR');return v;}
      let expr=raw.slice(1);
      expr=expr.replace(/\b(SUM|MEAN)\s*\(\s*\$?([A-E])\$?(\d+)\s*:\s*\$?([A-E])\$?(\d+)\s*\)/gi,(_,op,c1,r1,c2,r2)=>{
        const list=references(c1.toUpperCase()+r1,c2.toUpperCase()+r2).map(c=>this.#resolve(c,active));
        const total=list.reduce((a,b)=>a+b,0);return `(${op.toUpperCase()==='MEAN'?total/list.length:total})`;
      });
      expr=expr.replace(REF,(_,absCol,col,absRow,row)=>`(${this.#resolve(col.toUpperCase()+row,active)})`);
      return evaluate(expr,this.options);
    } finally {active.delete(cell);}
  }
  /** Serializable raw entries, preserving formulas rather than their displayed values. */
  snapshot() { return {version:1,cells:Object.fromEntries(this.cells)}; }
  static fromSnapshot(snapshot,options={}) {
    if (!snapshot || typeof snapshot!=='object' || Array.isArray(snapshot) || snapshot.version!==1 || !snapshot.cells || typeof snapshot.cells!=='object' || Array.isArray(snapshot.cells)) throw Error('Invalid spreadsheet snapshot');
    const entries=Object.entries(snapshot.cells);
    if(entries.length>225)throw Error('Invalid spreadsheet snapshot');
    const result=new Spreadsheet(options);
    for(const [cell,raw] of entries){
      if(typeof raw!=='string'||raw.length>10000||cell!==cell.toUpperCase())throw Error('Invalid spreadsheet snapshot');
      coordinate(cell);result.set(cell,raw);
    }
    return result;
  }
  /** Copy a cell, adjusting relative references; $ anchors column or row. */
  copy(from,to) {
    from=from.toUpperCase();to=to.toUpperCase();const f=coordinate(from),t=coordinate(to);
    const raw=this.get(from);
    const shifted=raw.startsWith('=')?raw.replace(REF,(_,absCol,col,absRow,row)=>{
      const x=coordinate(col.toUpperCase()+row);
      return absCol+address(x.col+(absCol?0:t.col-f.col),x.row+(absRow?0:t.row-f.row)).replace(/^(\w)(\d+)$/,(_,c,r)=>c+absRow+r);
    }):raw;
    this.set(to,shifted);
  }
  /** Move literal content; dependent formulas elsewhere are not rewritten. */
  move(from,to) {from=from.toUpperCase();to=to.toUpperCase();coordinate(from);coordinate(to);if(from===to)return;const raw=this.get(from);this.set(to,raw);this.clear(from);}
  /** Fill a rectangular range by copying the top-left cell, adjusting references. */
  fill(from,to) {const cells=references(from,to);const source=cells[0];for(const c of cells.slice(1))this.copy(source,c);}
}

export const SPREADSHEET_STORAGE_KEY='fx991lax.spreadsheet.v1';
/** On corrupt input, leave the original storage untouched and block automatic replacement. */
export function loadSpreadsheet(storage, options={}) {
  if(!storage)return {sheet:new Spreadsheet(options),blocked:false,error:'Armazenamento indisponível. A planilha não será salva neste dispositivo.'};
  try {
    const raw=storage.getItem(SPREADSHEET_STORAGE_KEY);
    if(raw===null)return {sheet:new Spreadsheet(options),blocked:false,error:null};
    try{return {sheet:Spreadsheet.fromSnapshot(JSON.parse(raw),options),blocked:false,error:null};}
    catch{return {sheet:new Spreadsheet(options),blocked:true,error:'Dados salvos inválidos. Eles foram preservados; a gravação automática está suspensa.'};}
  } catch {return {sheet:new Spreadsheet(options),blocked:true,error:'Não foi possível ler a planilha salva. Verifique o armazenamento do navegador.'};}
}
export function saveSpreadsheet(storage,sheet) {
  if(!storage)return false;
  try {storage.setItem(SPREADSHEET_STORAGE_KEY,JSON.stringify(sheet.snapshot()));return true;} catch{return false;}
}
