"use strict";
(() => {
  const form = document.querySelector('[data-checkout-form]');
  const progress = document.querySelector('[data-checkout-progress]');
  const pricing = window.ModafinilPreviewPricing;
  if (!form || !progress || !pricing) return;
  const cards = [...document.querySelectorAll('[data-wizard-stage]')];
  const indicators = [...document.querySelectorAll('[data-overview-step]')];
  const deliveryInputs = [...form.querySelectorAll('[data-delivery-input]')];
  const panels = [...form.querySelectorAll('[data-delivery-panel]')];
  const names = {"modaxl-200":"MODAXL 200","modawake":"MODAWAKE","modacare-200":"MODACARE 200","modacare-300":"MODACARE 300","armodacare-150":"ARMODACARE 150","armodacare-250":"ARMODACARE 250","modalert-200":"MODALERT 200","waklert":"WAKLERT","modvigil-200":"MODVIGIL 200","artvigil":"ARTVIGIL"};
  const key = 'modafinilshop-cart-v1';
  const list = document.querySelector('[data-checkout-items]');
  const summaryTotal = document.querySelector('[data-checkout-total]');
  const subtotal = document.querySelector('[data-checkout-subtotal]');
  const savings = document.querySelector('[data-checkout-savings]');
  const shipping = document.querySelector('[data-checkout-delivery]');
  const total = document.querySelector('[data-checkout-grandtotal]');
  const money = pricing.money;
  const field = id => document.getElementById(id);
  const textValue = id => (field(id)?.value || '').trim();
  const deliveryValue = () => deliveryInputs.find(el => el.checked)?.value || 'packeta-home';
  let stage = '1';
  let cart = {};
  try {
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    if (raw && typeof raw === 'object' && !Array.isArray(raw)) cart = raw;
  } catch {}
  const rows = Object.entries(cart).filter(([slug,qty])=>Object.hasOwn(names,slug) && Number.isInteger(Number(qty)) && Number(qty) >= 1 && Number(qty) <= 99);
  const activeInputs = number => {
    const panel = form.querySelector(`[data-wizard-stage="${number}"]`);
    return panel ? [...panel.querySelectorAll('input,select,textarea')].filter(el => !el.disabled && el.willValidate) : [];
  };
  const checkStage = number => {
    if (number === 1) {
      const telephone = field('telefon');
      if (telephone) {
        telephone.setCustomValidity(!/^[+\d()\s-]{7,20}$/.test(telephone.value.trim()) ? 'Zadajte platné telefónne číslo.' : '');
      }
    }
    const firstBad = activeInputs(number).find(el => !el.checkValidity());
    if (firstBad) {
      firstBad.reportValidity();
      firstBad.focus({preventScroll:false});
      return false;
    }
    if (number === 2 && !deliveryInputs.some(el => el.checked)) return false;
    return true;
  };
  const setStage = next => {
    stage = String(next);
    cards.forEach(card => {
      const shown = card.dataset.wizardStage === stage;
      card.hidden = !shown;
      card.inert = !shown;
      card.classList.toggle('is-active',shown);
    });
    const current = stage === 'review' || stage === 'success' ? 3 : Number(stage);
    indicators.forEach((indicator,index) => {
      const number = index + 1;
      indicator.classList.toggle('is-active',number === current && stage !== 'success');
      indicator.classList.toggle('is-done',number < current || stage === 'success');
      indicator.setAttribute('aria-current',number === current && stage !== 'success' ? 'step' : 'false');
    });
    progress.dataset.step = String(current);
    progress.classList.toggle('is-complete',stage === 'review' || stage === 'success');
    const screen = cards.find(card => card.dataset.wizardStage === stage);
    const top = Math.max(0, (document.querySelector('.checkout-hero-shell')?.getBoundingClientRect().top || 0) + window.scrollY - 104);
    window.scrollTo({top,behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    requestAnimationFrame(()=>{
      const heading = screen?.querySelector('h2');
      if (heading) {heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});}
    });
  };
  const toggleDelivery = () => {
    const chosen = deliveryValue();
    panels.forEach(panel=>{
      const shown=panel.dataset.deliveryPanel === chosen;
      panel.hidden=!shown;
      panel.inert=!shown;
      panel.classList.toggle('is-active',shown);
    });
    form.querySelectorAll('[data-required-for]').forEach(el=>{
      const modes=(el.dataset.requiredFor||'').split(/\s+/);
      el.required=modes.includes(chosen);
    });
  };
  const renderSummary = () => {
    if (!list) return;
    list.replaceChildren();
    const stats = pricing.total(Object.fromEntries(rows),390);
    if (!rows.length) {
      const empty = document.createElement('p');
      empty.className='wizard-empty';
      empty.textContent='Košík je prázdny. Vyberte produkty a vráťte sa k objednávke.';
      list.append(empty);
    }
    rows.forEach(([slug,quantity])=>{
      const line=pricing.line(slug,Number(quantity));
      if (!line) return;
      const item=document.createElement('div');item.className='checkout-item checkout-item-premium';
      const img=document.createElement('img');img.src=`assets/images/${slug}-main.webp`;img.alt=names[slug];img.loading='lazy';
      const body=document.createElement('div');body.className='checkout-item-body';
      const heading=document.createElement('div');heading.className='checkout-item-top';
      const name=document.createElement('strong');name.textContent=names[slug];
      const sum=document.createElement('b');sum.textContent=money(line.totalCents);heading.append(name,sum);
      const meta=document.createElement('div');meta.className='checkout-item-meta';
      const count=document.createElement('span');count.textContent=`${line.tablets} tabletiek · ${line.packs} × 10 ks`;
      const discount=document.createElement('span');discount.textContent=line.discountPercent?`Zľava −${line.discountPercent} % · ušetrené ${money(line.savedCents)}`:'Bez zľavy';
      meta.append(count,discount);body.append(heading,meta);item.append(img,body);list.append(item);
    });
    if (summaryTotal) summaryTotal.textContent=`${stats.tabletCount} tab.`;
    if (subtotal) subtotal.textContent=money(stats.subtotalCents);
    if (savings) savings.textContent=`−${money(stats.savingsCents)}`;
    if (shipping) shipping.textContent=money(rows.length ? 390 : 0);
    if (total) total.textContent=money(stats.totalCents);
    const chosen = deliveryValue();
    const isHome = chosen === 'packeta-home';
    const method = document.querySelector('[data-review-delivery]');
    if (method) method.textContent=isHome?'Packeta na adresu':'Packeta Z-BOX / výdajné miesto';
    const address=document.querySelector('[data-review-address]');
    if (address) address.textContent=isHome
      ? [textValue('ulica'),textValue('psc'),textValue('mesto'),textValue('krajina')].filter(Boolean).join(', ')
      : [textValue('boxmiesto'),textValue('psc_box'),textValue('mesto_box')].filter(Boolean).join(', ');
    const customerAddress=document.querySelector('[data-review-contact-address]');
    if (customerAddress) customerAddress.textContent=`Adresa: ${[textValue('ulica'),textValue('psc'),textValue('mesto'),textValue('krajina')].filter(Boolean).join(', ')}`;
    const customer=document.querySelector('[data-review-customer]');
    if (customer) customer.textContent=textValue('meno');
    const contact=document.querySelector('[data-review-contact]');
    if (contact) contact.textContent=[textValue('email'),textValue('telefon')].filter(Boolean).join(' · ');
    return stats;
  };
  form.addEventListener('submit',event=>event.preventDefault());
  form.querySelectorAll('[data-wizard-next]').forEach(button => button.addEventListener('click',()=>{
    const from=Number(button.dataset.wizardNext);
    if (!rows.length) {setStage('review');return;}
    if (!checkStage(from)) return;
    if (from === 3) {renderSummary();setStage('review');return;}
    setStage(from+1);
  }));
  document.querySelectorAll('[data-wizard-prev]').forEach(button => button.addEventListener('click',()=>setStage(button.dataset.wizardPrev)));
  deliveryInputs.forEach(input=>input.addEventListener('change',toggleDelivery));
  const telephone=field('telefon');
  telephone?.addEventListener('input',()=>telephone.setCustomValidity(''));
  document.querySelector('[data-wizard-confirm]')?.addEventListener('click',()=>{
    if (!rows.length) {setStage('review');return;}
    const consent=form.querySelector('[name="privacy_acknowledged"]');
    if (!consent?.checked) {consent?.reportValidity();return;}
    const suffix=String(Math.floor(100000+Math.random()*900000));
    const target=document.querySelector('[data-demo-number]');
    if (target) target.textContent=`DEMO-${suffix}`;
    setStage('success');
  });
  if (!rows.length) {
    const first=form.querySelector('[data-wizard-next="1"]');
    if (first) {first.disabled=true;first.setAttribute('aria-disabled','true');}
    const note=document.createElement('p');note.className='wizard-empty';note.textContent='Košík je prázdny. Vyberte produkty a potom pokračujte v objednávke.';
    form.querySelector('[data-wizard-stage="1"] .wizard-actions')?.before(note);
  }
  toggleDelivery();renderSummary();setStage('1');
})();
