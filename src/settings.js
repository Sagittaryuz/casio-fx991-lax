/** Independent display settings for the scientific calculator. */
export const SETTINGS_KEY = 'fx991lax.settings.v1';
export const DEFAULT_SETTINGS = Object.freeze({ angle: 'DEG', format: 'NORM', digits: 1 });
const angles = ['DEG','RAD','GRAD'];
const formats = ['FIX','SCI','NORM'];

export function validateSettings(value) {
  if (!value || !angles.includes(value.angle) || !formats.includes(value.format) ||
      !Number.isInteger(value.digits) || (value.format === 'NORM' ? ![1,2].includes(value.digits) : value.digits < 0 || value.digits > 9)) {
    throw Error('Configuração inválida');
  }
  return { angle:value.angle, format:value.format, digits:value.digits };
}

/** Never overwrites invalid stored data until the user explicitly saves or resets. */
export function createSettings(storage) {
  let current = {...DEFAULT_SETTINGS}, warning = '';
  try { if (storage===undefined) storage=globalThis.localStorage; const raw = storage?.getItem(SETTINGS_KEY); if (raw !== null && raw !== undefined) current=validateSettings(JSON.parse(raw)); }
  catch { warning='Não foi possível ler a configuração salva.'; }
  function write(next) {
    current=validateSettings(next); warning='';
    try { if (!storage) throw Error(); storage.setItem(SETTINGS_KEY,JSON.stringify(current)); }
    catch { warning='Não foi possível salvar a configuração; ela vale apenas nesta sessão.'; }
    return { settings:{...current}, warning };
  }
  return {
    get:()=>({...current}), getWarning:()=>warning,
    set:write, reset:()=>write({...DEFAULT_SETTINGS})
  };
}

/** Decimal output only; exact output may be displayed separately. */
export function formatNumber(value, settings=DEFAULT_SETTINGS) {
  const {format,digits}=validateSettings(settings);
  if (!Number.isFinite(value)) throw Error('Math ERROR');
  if (Object.is(value,-0)) value=0;
  const exponent=(number,decimalPlaces)=>number.toExponential(decimalPlaces)
    .replace(/e\+?(-?)0*(\d+)/,'×10^$1$2');
  if (format==='SCI') return exponent(value,(digits===0?10:digits)-1);
  if (format==='FIX') return Math.abs(value)>=1e10 ? exponent(value,9) : value.toFixed(digits);
  const n=Math.abs(value), threshold=digits===1?1e-2:1e-9;
  if (n!==0 && (n<threshold || n>=1e10)) return exponent(Number(value.toPrecision(10)),9).replace(/(\.\d*?)0+×/,'$1×').replace(/\.×/,'×');
  return String(Number(value.toPrecision(10)));
}

/** Staged setup form. onResetAll is invoked only after an explicit second click. */
export function mountSetup(container, store, callbacks={}) {
  const initial=store.get();
  container.innerHTML='<section class="setup-ui" aria-label="Configuração"><form><label>Unidade angular <select name="angle"><option value="DEG">Graus (DEG)</option><option value="RAD">Radianos (RAD)</option><option value="GRAD">Grados (GRAD)</option></select></label><label>Formato <select name="format"><option value="NORM">Normal (NORM)</option><option value="FIX">Casas decimais (FIX)</option><option value="SCI">Algarismos significativos (SCI)</option></select></label><label><span data-digit-label>Norma</span> <select name="digits"></select></label><div><button type="submit">Aplicar</button> <button type="button" data-cancel>Cancelar</button></div><div><button type="button" data-reset>Restaurar configuração</button> <button type="button" data-reset-all>Apagar todos os dados</button></div><div data-confirm hidden><span>Apagar também dados e planilha?</span> <button type="button" data-confirm-reset>Confirmar</button> <button type="button" data-cancel-reset>Cancelar</button></div><output role="status" aria-live="polite"></output></form></section>';
  const form=container.querySelector('form'),angle=form.elements.angle,format=form.elements.format,digits=form.elements.digits,output=form.querySelector('output'),confirm=form.querySelector('[data-confirm]');
  angle.value=initial.angle;format.value=initial.format;
  function setDigits(value){const norm=format.value==='NORM';digits.replaceChildren();for(const n of norm?[1,2]:[0,1,2,3,4,5,6,7,8,9]){const o=document.createElement('option');o.value=String(n);o.textContent=norm?`Norm ${n}`:String(n)+(format.value==='SCI'&&n===0?' (10 algarismos)':'');digits.append(o)}digits.value=String(value);if(digits.selectedIndex<0)digits.selectedIndex=0;form.querySelector('[data-digit-label]').textContent=norm?'Norma':format.value==='FIX'?'Casas decimais':'Algarismos significativos';}
  setDigits(initial.digits);output.textContent=store.getWarning();
  format.addEventListener('change',()=>setDigits(format.value==='NORM'?1:format.value==='SCI'?9:2));
  form.addEventListener('submit',event=>{event.preventDefault();try{const result=store.set({angle:angle.value,format:format.value,digits:Number(digits.value)});output.textContent=result.warning;callbacks.onApply?.(result.settings,result.warning)}catch(e){output.textContent=e.message}});
  form.querySelector('[data-cancel]').addEventListener('click',()=>callbacks.onCancel?.());
  form.querySelector('[data-reset]').addEventListener('click',()=>{const result=store.reset();angle.value=result.settings.angle;format.value=result.settings.format;setDigits(result.settings.digits);output.textContent=result.warning;callbacks.onApply?.(result.settings,result.warning)});
  const resetAll=form.querySelector('[data-reset-all]');if(!callbacks.onResetAll)resetAll.hidden=true;
  resetAll.addEventListener('click',()=>{confirm.hidden=false;});form.querySelector('[data-cancel-reset]').addEventListener('click',()=>{confirm.hidden=true;});
  form.querySelector('[data-confirm-reset]').addEventListener('click',()=>{try{callbacks.onResetAll?.();const result=store.reset();output.textContent=result.warning;callbacks.onApply?.(result.settings,result.warning);confirm.hidden=true}catch(e){output.textContent=e.message}});
  return ()=>container.replaceChildren();
}
