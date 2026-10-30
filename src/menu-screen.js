import './menu-screen.css';

// Symbols redrawn from the icon descriptions in Casio fx-991LA X quick-start,
// pages 2–3. The module owns selection only; it never changes calculator state.
export const MENU_MODES = Object.freeze([
 {id:'Cálculo',label:'Calcular',shortcut:'1',icon:'calc'},
 {id:'Complexos',label:'Complexos',shortcut:'2',icon:'complex'},
 {id:'Base-N',label:'Base-N',shortcut:'3',icon:'base'},
 {id:'matrix',label:'Matriz',shortcut:'4',icon:'matrix'},
 {id:'vector',label:'Vetor',shortcut:'5',icon:'vector'},
 {id:'statistics',label:'Estatística',shortcut:'6',icon:'statistics'},
 {id:'distribution',label:'Distribuição',shortcut:'7',icon:'distribution'},
 {id:'spreadsheet',label:'Planilha',shortcut:'8',icon:'sheet'},
 {id:'table',label:'Tabela',shortcut:'9',icon:'table'},
 {id:'equation',label:'Equação/Função',shortcut:'A',icon:'equation'},
 {id:'Desigualdade',label:'Desigualdade',shortcut:'B',icon:'inequality'},
 {id:'Proporção',label:'Proporção',shortcut:'C',icon:'ratio'}
]);
const icons={
 calc:'<path d="M4 4l5 5m0-5L4 9M15 6h8M19 2v1M19 9v1M4 15h6m-3-3v6M15 15h8"/>',
 complex:'<rect x="4" y="3" width="10" height="14"/><text x="7" y="14">i</text><path d="M17 15l8-10v10h-8z"/>',
 base:'<text x="3" y="8">2 8</text><text x="1" y="18">10 16</text>',
 matrix:'<path d="M5 2H2v16h3M25 2h3v16h-3"/><rect x="8" y="4" width="5" height="5"/><rect x="17" y="4" width="5" height="5"/><rect x="8" y="12" width="5" height="5"/><rect x="17" y="12" width="5" height="5"/>',
 vector:'<path d="M4 17h20m-4-4 4 4-4 3M4 17V3m-3 4 3-4 3 4M4 17 20 3m-5 0h5v5"/>',
 statistics:'<path d="M3 2v16h23M7 14h4v4H7zM13 7h4v11h-4zM19 11h4v7h-4z"/>',
 distribution:'<path d="M2 18h25M5 17c6 0 5-13 10-13s4 13 10 13M15 2v16"/>',
 sheet:'<rect x="3" y="2" width="24" height="17"/><path d="M3 7h24M3 12h24M3 16h24M9 2v17M16 2v17M22 2v17"/>',
 table:'<rect x="3" y="2" width="24" height="17"/><path d="M3 7h24M15 7v12M6 11h6M6 15h6M18 11h6M18 15h6"/>',
 equation:'<text x="3" y="8">x y</text><text x="4" y="18">= 0</text>',
 inequality:'<text x="3" y="8">x y</text><text x="4" y="18">&gt; 0</text>',
 ratio:'<rect x="3" y="5" width="8" height="10"/><rect x="19" y="5" width="8" height="10"/><path d="M15 8v1m0 4v1"/>'
};
function iconSvg(name){return `<svg viewBox="0 0 30 21" aria-hidden="true"><g>${icons[name]}</g></svg>`}

/** Mount the icon screen. `press` accepts calculator action names.
 * `onSelect(id)` commits; `onCancel()` leaves the current calculation intact. */
export function mountMenuScreen(container,{onSelect=()=>{},onCancel=()=>{},initial=0}={}){
 let selected=Number.isInteger(initial)?Math.max(0,Math.min(11,initial)):0,alpha=false;
 const root=document.createElement('section');root.className='fx-menu-screen';root.setAttribute('aria-label','Menu principal da calculadora');root.setAttribute('role','group');
 const grid=document.createElement('div');grid.className='fx-menu-grid';const label=document.createElement('div');label.className='fx-menu-label';label.setAttribute('aria-live','polite');
 const up=document.createElement('span'),down=document.createElement('span');up.className='fx-menu-up';down.className='fx-menu-down';up.textContent='▲';down.textContent='▼';up.setAttribute('aria-hidden','true');down.setAttribute('aria-hidden','true');root.append(up,grid,down,label);container.replaceChildren(root);
 function render(){const row=Math.floor(selected/4),first=row>1?4:0;grid.replaceChildren();for(let i=first;i<Math.min(first+8,MENU_MODES.length);i++){const item=MENU_MODES[i],button=document.createElement('button');button.type='button';button.className='fx-menu-icon'+(i===selected?' selected':'');button.setAttribute('aria-label',`${item.shortcut}: ${item.label}`);button.setAttribute('aria-pressed',String(i===selected));button.innerHTML=iconSvg(item.icon)+`<span>${item.shortcut}</span>`;button.addEventListener('click',()=>{selected=i;render();onSelect(item.id)});grid.append(button)}label.textContent=`${MENU_MODES[selected].shortcut}:${MENU_MODES[selected].label}`;up.hidden=first===0;down.hidden=first+8>=MENU_MODES.length;}
 function press(action){if(action==='alpha'){alpha=true;return true}if(action==='shift'){alpha=false;return true}const alphad=alpha;alpha=false;
  let shortcut=/^[1-9]$/.test(action)?action:null;
  if(alphad) shortcut=({negative:'A',dms:'B',inverse:'C'})[action]||null;
  if(shortcut){const item=MENU_MODES.find(x=>x.shortcut===shortcut);if(item){onSelect(item.id);return true}}
  if(action==='equals'){onSelect(MENU_MODES[selected].id);return true}
  if(action==='clear'||action==='del'){onCancel();return true}
  if(action==='left')selected=Math.max(0,selected-1);else if(action==='right')selected=Math.min(11,selected+1);else if(action==='up')selected=Math.max(0,selected-4);else if(action==='down')selected=Math.min(11,selected+4);else return false;
  render();return true;
 }
 function key(e){const a=({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down',Enter:'equals',Escape:'clear',Backspace:'del'})[e.key]||(/^[1-9]$/.test(e.key)?e.key:null);if(a){e.preventDefault();e.stopPropagation();press(a)}}root.addEventListener('keydown',key);root.tabIndex=0;render();return {element:root,press,focus:()=>root.focus(),destroy:()=>{root.remove()},getSelected:()=>selected};
}
