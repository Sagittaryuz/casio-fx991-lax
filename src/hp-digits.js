import {lcdGlyphs} from './hp-lcd-glyphs.mjs';
const masks=Object.fromEntries(Object.entries(lcdGlyphs).filter(([key])=>/^[0-9]$/.test(key)).map(([key,path])=>[key,`url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23 38"><path d="${path}"/></svg>`)}")`]));
/** Preserve text for accessibility and copy while drawing the HP segment contours. */
export function applyDigitGlyph(span,char){if(masks[char]){span.classList.add('lcd-segment');span.style.setProperty('--digit-mask',masks[char]);}span.textContent=char;}
export function renderSegmentText(host,value){const fragment=document.createDocumentFragment();for(const ch of value){const span=document.createElement('span');applyDigitGlyph(span,ch);fragment.append(span)}host.replaceChildren(fragment)}
