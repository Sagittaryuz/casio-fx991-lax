/** Editing state for calculation mode; no DOM or firmware dependencies. */
export class CalculatorEditor {
  constructor(snapshot={}) {
    this.expression=typeof snapshot.expression==='string'?snapshot.expression:'';
    this.cursor=Math.max(0,Math.min(this.expression.length,Number.isInteger(snapshot.cursor)?snapshot.cursor:this.expression.length));
    this.modifier=null;
    this.ans=Number.isFinite(snapshot.ans)?snapshot.ans:0;
    this.variables=Object.fromEntries(['A','B','C','D','E','F','x','y','M'].map(k=>[k, Number.isFinite(snapshot.variables?.[k])?snapshot.variables[k]:0]));
  }
  insert(text){text=String(text);this.expression=this.expression.slice(0,this.cursor)+text+this.expression.slice(this.cursor);this.cursor+=text.length;}
  backspace(){if(this.cursor>0){this.expression=this.expression.slice(0,this.cursor-1)+this.expression.slice(this.cursor);this.cursor--;}}
  move(offset){this.cursor=Math.max(0,Math.min(this.expression.length,this.cursor+offset));}
  clear(){this.expression='';this.cursor=0;this.modifier=null;}
  setModifier(value){if(value!==null&&value!=='shift'&&value!=='alpha')throw Error('Invalid modifier');this.modifier=this.modifier===value?null:value;}
  consumeModifier(){const value=this.modifier;this.modifier=null;return value;}
  store(name,value){if(!Object.hasOwn(this.variables,name)||!Number.isFinite(value))throw Error('Invalid variable');this.variables[name]=value;}
  recall(name){if(!Object.hasOwn(this.variables,name))throw Error('Invalid variable');return this.variables[name];}
  snapshot(){return {expression:this.expression,cursor:this.cursor,ans:this.ans,variables:{...this.variables}};}
}
