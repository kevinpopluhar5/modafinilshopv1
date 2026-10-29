(() => {
  const form = document.querySelector('[data-checkout-form]');
  if (!form) return;
  const holder = document.querySelector('[data-packeta-widget]');
  const selectButton = document.querySelector('[data-packeta-open]');
  const selected = document.querySelector('[data-packeta-selected]');
  const pointField = document.querySelector('[data-packeta-point-id]');
  const deliveryInputs = [...document.querySelectorAll('[data-delivery-input]')];
  let activeConfig = null;
  let loading = null;
  const library = () => {
    if (window.Packeta?.Widget?.pick) return Promise.resolve();
    if (loading) return loading;
    loading = new Promise((resolve, reject) => {
      const script=document.createElement('script');
      script.src='https://widget.packeta.com/v6/www/js/library.js';
      script.async=true;
      script.onload=()=>window.Packeta?.Widget?.pick ? resolve() : reject(new Error('WIDGET_UNAVAILABLE'));
      script.onerror=()=>reject(new Error('WIDGET_UNAVAILABLE'));
      document.head.appendChild(script);
    });
    return loading;
  };
  const savePoint = point => {
    if (!point?.id) return;
    if (pointField) pointField.value=String(point.id);
    const label=String(point.name || point.label || 'Zvolené výdajné miesto');
    const box=document.querySelector('#boxmiesto');
    const city=document.querySelector('#mesto_box');
    const zip=document.querySelector('#psc_box');
    if (box) box.value=label;
    if (city) city.value=String(point.city || '');
    if (zip) zip.value=String(point.zip || point.postcode || '');
    if (selected) selected.textContent=`Vybrané: ${label}`;
    for (const field of [box,city,zip]) field?.dispatchEvent(new Event('input',{bubbles:true}));
  };
  selectButton?.addEventListener('click',async()=>{
    if (!activeConfig?.packetaWidgetKey) return;
    selectButton.disabled=true;
    try {
      await library();
      window.Packeta.Widget.pick(activeConfig.packetaWidgetKey, savePoint, {language:'sk',country:'sk',vendors:'packeta'});
    } catch { if(selected) selected.textContent='Výber miesta sa nepodarilo načítať. Skúste to znova.'; }
    finally { selectButton.disabled=false; }
  });
  deliveryInputs.forEach(input=>input.addEventListener('change',()=>{
    if(input.checked && pointField){pointField.value='';if(selected) selected.textContent='';}
  }));
  fetch('/api/config',{headers:{Accept:'application/json'},cache:'no-store'})
    .then(async response=>response.ok ? response.json() : null)
    .then(config=>{
      if (!config || typeof config!=='object') return;
      activeConfig=config;
      if (config.packetaWidgetKey && holder) holder.hidden=false;
    }).catch(()=>{});
})();
