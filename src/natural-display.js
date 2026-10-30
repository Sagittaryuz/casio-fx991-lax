/** Visual formatting only. The editable source stays a plain expression. */
export function renderNatural(host, text, cursor = null) {
  text=String(text); host.replaceChildren(); let marked=false;
  const marker=(parent,pos)=>{if(!marked&&cursor===pos){const el=document.createElement('span');el.className='math-caret';el.setAttribute('aria-hidden','true');parent.append(el);marked=true;}};
  const literal=(parent,index)=>{marker(parent,index);parent.append(document.createTextNode(text[index]));};
  const close=(start,limit)=>{let depth=0;for(let p=start;p<limit;p++){if(text[p]==='(')depth++;if(text[p]===')'&&--depth===0)return p}return -1};
  const operand=(start,limit)=>{if(text[start]==='('){const end=close(start,limit);return end<0?null:{start,end:end+1,innerStart:start+1,innerEnd:end};}const m=text.slice(start,limit).match(/^(?:\d+(?:[.,]\d*)?|[A-Za-zπ]+)/);return m?{start,end:start+m[0].length,innerStart:start,innerEnd:start+m[0].length}:null};
  const hidden=(parent,from,to)=>{for(let p=from;p<to;p++)marker(parent,p)};
  const walk=(parent,from,to)=>{let i=from;while(i<to){
    // Roots: sqrt(expression) or cbrt(expression).
    const root=/^(sqrt|cbrt)\(/.exec(text.slice(i,to));if(root){const o=i+root[1].length,found=close(o,to),e=found<0?to:found;{const box=document.createElement('span');box.className='math-root';const sign=document.createElement('span');sign.className='math-root-sign';sign.textContent=root[1]==='cbrt'?'∛':'√';hidden(box,i,o+1);box.append(sign);const inside=document.createElement('span');inside.className='math-radicand';walk(inside,o+1,e);marker(inside,e);box.append(inside);parent.append(box);i=found<0?to:e+1;continue}}
    const a=operand(i,to); if(a){
      if(a.end<to && text[a.end]==='/'){const b=operand(a.end+1,to);if(b){const frac=document.createElement('span');frac.className='math-fraction';const num=document.createElement('span');num.className='math-numerator';hidden(num,a.start,a.innerStart);walk(num,a.innerStart,a.innerEnd);hidden(num,a.innerEnd,a.end);marker(num,a.end);const den=document.createElement('span');den.className='math-denominator';hidden(den,a.end+1,b.innerStart);walk(den,b.innerStart,b.innerEnd);hidden(den,b.innerEnd,b.end);frac.append(num,den);parent.append(frac);i=b.end;continue}}
      if(a.end<to&&text[a.end]==='^'){const b=operand(a.end+1,to);if(b){const box=document.createElement('span');box.className='math-power';hidden(box,a.start,a.innerStart);walk(box,a.innerStart,a.innerEnd);hidden(box,a.innerEnd,a.end);marker(box,a.end);const sup=document.createElement('sup');hidden(sup,a.end+1,b.innerStart);walk(sup,b.innerStart,b.innerEnd);hidden(sup,b.innerEnd,b.end);box.append(sup);parent.append(box);i=b.end;continue}}
    }
    literal(parent,i++);
  }marker(parent,to)};
  walk(host,0,text.length);
  if(cursor!==null&&!marked) marker(host,text.length);
}
