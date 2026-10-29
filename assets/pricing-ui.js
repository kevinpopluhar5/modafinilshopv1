"use strict";
(() => {
  const p=globalThis.ModafinilPreviewPricing;
  if (!p) return;
  const discountText = packs => p.discount(packs) ? `−${p.discount(packs)} %` : 'bez zľavy';
  function refreshCard(wrap) {
    const slug=wrap.querySelector('[data-add-product]')?.dataset.addProduct;
    const select=wrap.querySelector('[data-pack-select]');
    if(!slug||!select)return;
    const packs=Number(select.value), info=p.line(slug,packs);
    if(!info)return;
    const qty=wrap.querySelector('[data-qty-input]');if(qty)qty.value=String(packs);
    const line=wrap.querySelector('[data-tier-preview]');if(line)line.textContent=`${p.money(info.totalCents)} spolu · ${discountText(packs)}`;
  }
  document.querySelectorAll('.ms-card-purchase').forEach(wrap=>{
    const select=wrap.querySelector('[data-pack-select]');if(!select)return;
    select.addEventListener('change',()=>refreshCard(wrap));refreshCard(wrap);
  });
  document.querySelectorAll('.ms-detail-purchase').forEach(block=>{
    const slug=block.querySelector('[data-add-product]')?.dataset.addProduct;
    if(!slug)return;
    const inputs=[...block.querySelectorAll('[data-pack-radio]')];
    const update=()=>{
      const selected=inputs.find(i=>i.checked),packs=Number(selected?.value||1),row=p.line(slug,packs);
      if(!row)return;
      const qty=block.querySelector('[data-qty-input]');if(qty)qty.value=String(packs);
      const text=block.querySelector('[data-price-total]'),old=block.querySelector('[data-price-old]'),save=block.querySelector('[data-price-save]'),summary=block.querySelector('[data-tier-summary]');
      if(text)text.textContent=p.money(row.totalCents);
      if(old)old.textContent=row.savedCents?p.money(row.baseCents):'';
      if(save)save.textContent=row.savedCents?`Ušetríte ${p.money(row.savedCents)} (−${row.discountPercent} %)`:'Základná cena';
      if(summary)summary.textContent=`${row.tablets} tabletiek · ${row.packs} × 10 ks`;
      document.dispatchEvent(new CustomEvent('ms-pricing-updated',{detail:{slug,packs,tablets:row.tablets,totalCents:row.totalCents}}));
    };
    inputs.forEach(i=>i.addEventListener('change',update));update();
  });
})();
