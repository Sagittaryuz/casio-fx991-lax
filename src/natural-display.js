/** Render a mathematical expression while retaining source offsets for touch editing. */
export function renderNatural(host, source, cursor = null, selectionEnd = cursor) {
  const text=String(source); host.replaceChildren(); const anchors=[];
  const start=cursor===null?-1:Math.min(cursor,selectionEnd??cursor), end=cursor===null?-1:Math.max(cursor,selectionEnd??cursor);
  function boundary(parent,index){const b=document.createElement('span');b.className='math-boundary';b.dataset.offset=index;b.setAttribute('aria-hidden','true');if(index===cursor&&start===end)b.classList.add('math-caret');parent.append(b);anchors.push(b)}
  function char(parent,i){boundary(parent,i);const span=document.createElement('span');span.className='math-char';span.textContent=text[i];if(i>=start&&i<end)span.classList.add('math-selected');parent.append(span)}
  function hidden(parent,a,b){for(let i=a;i<b;i++)boundary(parent,i)}
  function matchClose(a,b){let depth=0;for(let i=a;i<b;i++){if(text[i]==='(')depth++;else if(text[i]===')'&&--depth===0)return i}return -1}
  function wrapped(a,b){return text[a]==='('&&matchClose(a,b)===b-1}
  function split(a,b,ops){let depth=0, result=-1;for(let i=a;i<b;i++){let c=text[i];if(c==='(')depth++;else if(c===')')depth--;else if(depth===0&&ops.includes(c)){if((c==='+'||c==='-')&&(i===a||'+-*/^(;'.includes(text[i-1])))continue;result=i}}return result}
  function component(parent,a,b,strip){if(strip&&wrapped(a,b)){hidden(parent,a,a+1);walk(parent,a+1,b-1);hidden(parent,b-1,b)}else walk(parent,a,b)}
  function walk(parent,a,b){if(a>=b){boundary(parent,a);return}
    let i=split(a,b,'+-');if(i>=0){walk(parent,a,i);char(parent,i);walk(parent,i+1,b);return}
    // Fractions: preserve left-associative expression structure.
    i=split(a,b,'*/');if(i>=0){if(text[i]==='/'){const box=document.createElement('span');box.className='math-fraction';const n=document.createElement('span'),d=document.createElement('span');n.className='math-numerator';d.className='math-denominator';component(n,a,i,true);hidden(n,i,i+1);component(d,i+1,b,true);box.append(n,d);parent.append(box)}else{walk(parent,a,i);char(parent,i);walk(parent,i+1,b)}return}
    i=split(a,b,'^');if(i>=0){const box=document.createElement('span');box.className='math-power';walk(box,a,i);hidden(box,i,i+1);const sup=document.createElement('sup');component(sup,i+1,b,true);box.append(sup);parent.append(box);return}
    const root=/^(sqrt|cbrt)\(/.exec(text.slice(a,b));if(root){const open=a+root[1].length,close=matchClose(open,b);if(close===b-1||close<0){const box=document.createElement('span');box.className='math-root';hidden(box,a,open+1);const sign=document.createElement('span');sign.className='math-root-sign';sign.textContent=root[1]==='cbrt'?'∛':'√';box.append(sign);const inner=document.createElement('span');inner.className='math-radicand';walk(inner,open+1,close<0?b:close);if(close>=0)hidden(inner,close,close+1);box.append(inner);parent.append(box);return}}
    if(wrapped(a,b)){char(parent,a);walk(parent,a+1,b-1);char(parent,b-1);return}
    for(let n=a;n<b;n++)char(parent,n);
  }
  walk(host,0,text.length);boundary(host,text.length);
}

/** Locate the nearest visual caret boundary, including numerator and denominator. */
export function naturalOffsetAt(host,x,y){let best=0,score=Infinity;for(const el of host.querySelectorAll('.math-boundary')){const r=el.getBoundingClientRect();if(!r.height)continue;const dx=Math.abs(x-r.left),dy=y<r.top?r.top-y:y>r.bottom?y-r.bottom:0;const s=dy*3+dx;if(s<score){score=s;best=Number(el.dataset.offset)}}return best}

/** Find the innermost fraction group containing the cursor. */
export function fractionTarget(text,cursor,direction){const pairs=[];const stack=[];for(let i=0;i<text.length;i++){if(text[i]==='(')stack.push(i);else if(text[i]===')'&&stack.length){const left=stack.pop();pairs.push([left,i])}}const byStart=new Map(pairs.map(p=>[p[0],p[1]]));const candidates=[];for(const [a,b] of pairs){if(text[b+1]!=='/'||text[b+2]!=='(')continue;const d=byStart.get(b+2);if(d!==undefined&&cursor>=a&&cursor<=d+1)candidates.push({a,b,d})}candidates.sort((x,y)=>(x.d-x.a)-(y.d-y.a));const f=candidates.find(v=>direction==='up'?cursor>=v.b+2:cursor<=v.b+1);return f?(direction==='up'?f.b:f.d):null}
