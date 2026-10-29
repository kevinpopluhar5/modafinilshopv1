"use strict";
(() => {
  const catalog = Object.freeze({
    "modaxl-200":"MODAXL 200","modawake":"MODAWAKE","modacare-200":"MODACARE 200",
    "modacare-300":"MODACARE 300","armodacare-150":"ARMODACARE 150","armodacare-250":"ARMODACARE 250",
    "modalert-200":"MODALERT 200","waklert":"WAKLERT","modvigil-200":"MODVIGIL 200","artvigil":"ARTVIGIL"
  });
  const root = document.body.dataset.cartRoot || "";
  const pricing=globalThis.ModafinilPreviewPricing;
  const key = "modafinilshop-cart-v1";
  const minQty = 1;
  const maxQty = 99;
  let cart = Object.create(null);
  let lastFocus = null;
  let toastTimer = null;
  const panel = document.getElementById("ms-cart-panel");
  const overlay = document.querySelector("[data-cart-backdrop]");
  const items = document.querySelector("[data-cart-items]");
  if (!panel || !overlay || !items) return;
  function countValue(v) {const n=Number(v);return Number.isFinite(n)?Math.min(maxQty,Math.max(minQty,Math.trunc(n))):minQty;}
  function load() {
    try {
      const raw=JSON.parse(localStorage.getItem(key) || "{}");
      if (raw && typeof raw === "object" && !Array.isArray(raw)) {
        for (const [slug,value] of Object.entries(raw)) {
          if (Object.hasOwn(catalog,slug) && Number.isInteger(value) && value >= 1) cart[slug]=countValue(value);
        }
      }
    } catch(e){ 
 }
  }
  function save(){try{localStorage.setItem(key,JSON.stringify(cart));}catch(e){ 
 }}
  const getCount=()=>Object.values(cart).reduce((a,n)=>a+n,0);
  function updateCounts(){
    const total=getCount();
    document.querySelectorAll("[data-cart-count]").forEach(el=>{el.textContent=String(total)});
    document.querySelectorAll("[data-cart-open]").forEach(el=>el.setAttribute("aria-label",`Otvoriť košík (${total} kusov)`));
    const heading=panel.querySelector("[data-cart-heading-count]");if(heading)heading.textContent=`(${total})`;
    const summary=panel.querySelector("[data-cart-total]");if(summary)summary.textContent=`${total} ks`;
    const clear=panel.querySelector("[data-cart-clear]");if(clear)clear.disabled=total===0;
  }
  function icon(type){
    if(type==="minus")return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14"/></svg>';
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';
  }
  function render() {
    items.replaceChildren();
    const slugs=Object.keys(cart).filter(s=>Object.hasOwn(catalog,s));
    if (!slugs.length) {
      const empty=document.createElement('div');empty.className='ms-cart-empty';
      empty.innerHTML='<div class="ms-cart-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 2h2l2.4 12.3a2 2 0 0 0 2 1.7h11a2 2 0 0 0 2-1.6L23 6H4"/></svg></div><h3>Košík je prázdny</h3><p>Vyberte si produkty a pridajte ich do košíka.</p>';
      items.append(empty);
    }
    for (const slug of slugs) {
      const row=document.createElement('div');row.className='ms-cart-line';
      const imgwrap=document.createElement('div');imgwrap.className='ms-cart-thumbnail';
      const pic=document.createElement('img');pic.src=root+'assets/images/'+slug+'-main.webp';pic.alt='';pic.width=70;pic.height=70;imgwrap.append(pic);
      const content=document.createElement('div');
      const link=document.createElement('a');link.href=root+'products/'+slug+'.html';link.className='ms-cart-line-name';link.textContent=catalog[slug];
      const meta=document.createElement('div');meta.className='ms-cart-line-meta';meta.textContent=`${cart[slug]*10} tabletiek${pricing?.discount(cart[slug]) ? ' · −'+pricing.discount(cart[slug])+' %' : ''}`;
      const control=document.createElement('div');control.className='ms-cart-line-controls';
      const qty=document.createElement('div');qty.className='ms-qty';qty.dataset.qtyWrap='';qty.dataset.slug=slug;
      qty.innerHTML='<button type="button" data-qty-minus aria-label="Znížiť počet kusov">'+icon('minus')+'</button><input type="number" data-qty-input min="1" max="99" step="1" inputmode="numeric" aria-label="Počet kusov"/><button type="button" data-qty-plus aria-label="Zvýšiť počet kusov">'+icon('plus')+'</button>';
      qty.querySelector('input').value=String(cart[slug]);
      const remove=document.createElement('button');remove.type='button';remove.className='ms-cart-remove';remove.dataset.cartRemove=slug;remove.textContent='Odstrániť';
      const sum=document.createElement('div');sum.className='ms-cart-price';const line=pricing?.line(slug,cart[slug]);if(line){sum.textContent=pricing.money(line.totalCents);if(line.savedCents){const old=document.createElement('s');old.textContent=pricing.money(line.baseCents);sum.prepend(old);}}control.append(qty,remove);content.append(link,meta,sum,control);row.append(imgwrap,content);items.append(row);
    }
    if (pricing && slugs.length) {
      const stats=pricing.total(cart);
      const summary=document.createElement('div');summary.className='ms-cart-preview-sum';
      summary.innerHTML=`<span>Spolu s dopravou SK (3,90 €)</span><strong>${pricing.money(stats.totalCents)}</strong>`;
      items.append(summary);
      if(stats.savingsCents){const savings=document.createElement('div');savings.className='ms-cart-savings';savings.textContent=`Zľava na baleniach: −${pricing.money(stats.savingsCents)}`;items.append(savings);}
    }
    updateCounts();
  }
  function updateQtyButtons(wrap){
    const input=wrap.querySelector('[data-qty-input]');if(!input)return;
    const value=countValue(input.value);input.value=String(value);
    const isCart=Boolean(wrap.closest('.ms-cart-panel'));
    const minus=wrap.querySelector('[data-qty-minus]');const plus=wrap.querySelector('[data-qty-plus]');
    if(minus)minus.disabled=isCart?false:value===1;
    if(plus)plus.disabled=value===maxQty;
  }
  function syncQtyButtons(){document.querySelectorAll('[data-qty-wrap]').forEach(updateQtyButtons)}
  function open(){
    lastFocus=document.activeElement;
    panel.inert=false;overlay.hidden=false;render();syncQtyButtons();
    document.body.classList.add('ms-cart-lock');
    requestAnimationFrame(()=>{panel.classList.add('is-open');overlay.classList.add('is-visible');panel.querySelector('[data-cart-close]').focus()});
  }
  function close(){
    panel.classList.remove('is-open');overlay.classList.remove('is-visible');document.body.classList.remove('ms-cart-lock');panel.inert=true;
    window.setTimeout(()=>{if(!panel.classList.contains('is-open'))overlay.hidden=true},340);
    if(lastFocus && lastFocus.isConnected && typeof lastFocus.focus==='function')lastFocus.focus();
  }
  function toast(message){
    const node=document.querySelector('[data-cart-toast]');if(!node)return;
    node.textContent=message;node.classList.add('is-visible');
    clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('is-visible'),2500);
  }
  function bump(){
    document.querySelectorAll('[data-cart-open]').forEach(el=>{
      el.classList.remove('ms-cart-arrival');
      void el.offsetWidth;
      el.classList.add('ms-cart-arrival');
      el.addEventListener('animationend',()=>el.classList.remove('ms-cart-arrival'),{once:true});
    });
  }
  function flyToCart(button,slug){
    const icon=document.querySelector('.header [data-cart-open]');
    const source=button.closest('.card,.pd-hero,.pd-picture-col');
    const photo=source?.querySelector('.product-visual img,.pd-picture-card img');
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(!icon||reduce||!Element.prototype.animate)return Promise.resolve();
    const target=icon.getBoundingClientRect();
    const imageRect=photo?.getBoundingClientRect();
    const buttonRect=button.getBoundingClientRect();
    const stickyButton=document.querySelector('.ms-mobile-sticky:not([hidden]) .ms-mobile-sticky-add');
    const fallback=stickyButton&&buttonRect.bottom<0?stickyButton.getBoundingClientRect():buttonRect;
    const originRect=imageRect&&imageRect.top<innerHeight&&imageRect.bottom>0&&imageRect.left<innerWidth&&imageRect.right>0
      ?imageRect:fallback;
    if(!target.width||!originRect.width)return Promise.resolve();
    const size=innerWidth<=650?108:142;
    const cx=originRect.left+originRect.width/2, cy=Math.min(innerHeight-25,Math.max(25,originRect.top+originRect.height/2));
    const tx=target.left+target.width/2, ty=target.top+target.height/2;
    const fly=document.createElement('div');fly.className='ms-flying-product';fly.setAttribute('aria-hidden','true');
    fly.style.width=size+'px';fly.style.height=size+'px';
    fly.style.left=(cx-size/2)+'px';fly.style.top=(cy-size/2)+'px';
    const img=document.createElement('img');img.alt='';img.src=photo?.currentSrc||photo?.src||root+'assets/images/product-placeholder.svg';
    fly.appendChild(img);
    const name=document.createElement('span');name.textContent=catalog[slug];fly.appendChild(name);
    document.body.appendChild(fly);
    const dx=tx-cx,dy=ty-cy;
    const lift=Math.min(112,Math.max(36,Math.abs(dx)*.11));
    const points=[
      {transform:'translate3d(0px,0px,0) scale(1) rotate(-8deg)',opacity:1,offset:0},
      {transform:`translate3d(${dx*.23}px,${dy*.17-lift}px,0) scale(1.04) rotate(4deg)`,opacity:1,offset:.30},
      {transform:`translate3d(${dx*.62}px,${dy*.52-lift*.55}px,0) scale(.8) rotate(8deg)`,opacity:1,offset:.66},
      {transform:`translate3d(${dx}px,${dy}px,0) scale(.24) rotate(12deg)`,opacity:0,offset:1}
    ];
    const motion=fly.animate(points,{duration:innerWidth<=650?1250:1120,easing:'cubic-bezier(.27,.65,.25,1)',fill:'forwards'});
    return motion.finished.catch(()=>{}).then(()=>{fly.remove()});
  }
  function add(slug,qty,button){
    if(!Object.hasOwn(catalog,slug))return;
    cart[slug]=Math.min(maxQty,(cart[slug]||0)+qty);
    save();render();
    if(button&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      button.classList.remove('ms-added-feedback');
      void button.offsetWidth;
      button.classList.add('ms-added-feedback');
      window.setTimeout(()=>button.classList.remove('ms-added-feedback'),520);
    }
    flyToCart(button,slug).then(()=>{
      bump();
      toast('Produkt bol pridaný do košíka');
    });
  }
  function editCart(slug,qty){if(!Object.hasOwn(catalog,slug))return;if(qty<=0)delete cart[slug];else cart[slug]=countValue(qty);save();render();syncQtyButtons();}
  document.addEventListener('click',(event)=>{
    const target=event.target;
    if (!(target instanceof Element))return;
    if(target.closest('[data-cart-open]')){open();return}
    if(target.closest('[data-cart-close]')||target.closest('[data-cart-backdrop]')){close();return}
    const clear=target.closest('[data-cart-clear]');if(clear){cart=Object.create(null);save();render();return}
    const remove=target.closest('[data-cart-remove]');if(remove){editCart(remove.dataset.cartRemove,0);return}
    const addButton=target.closest('[data-add-product]');if(addButton){
      const wrap=addButton.parentElement.querySelector('[data-qty-wrap]');const qty=countValue(wrap?.querySelector('[data-qty-input]')?.value||1);
      add(addButton.dataset.addProduct,qty,addButton);return;
    }
    const deltaButton=target.closest('[data-qty-minus],[data-qty-plus]');if(deltaButton){
      const wrap=deltaButton.closest('[data-qty-wrap]');if(!wrap)return;
      const input=wrap.querySelector('[data-qty-input]');const isCart=Boolean(wrap.closest('.ms-cart-panel'));
      const delta=deltaButton.hasAttribute('data-qty-plus')?1:-1;
      const current=countValue(input.value);const next=current+delta;
      if(isCart){editCart(wrap.dataset.slug,next);if(next<=0)toast('Produkt odstránený');}
      else{input.value=String(countValue(next));updateQtyButtons(wrap)}
    }
  });
  document.addEventListener('change',(event)=>{
    const input=event.target;
    if(!(input instanceof HTMLInputElement)||!input.matches('[data-qty-input]'))return;
    const wrap=input.closest('[data-qty-wrap]');if(!wrap)return;
    const value=countValue(input.value);input.value=String(value);
    if(wrap.closest('.ms-cart-panel'))editCart(wrap.dataset.slug,value);else updateQtyButtons(wrap);
  });
  document.addEventListener('keydown',(event)=>{
    if(event.key==='Escape'&&panel.classList.contains('is-open')){event.preventDefault();close();return}
    if(event.key==='Tab'&&panel.classList.contains('is-open')){
      const focusable=[...panel.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')].filter(x=>x.getClientRects().length);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}
    }
  });
  window.addEventListener('storage',(event)=>{if(event.key===key){cart=Object.create(null);load();render();syncQtyButtons()}});
  load();render();syncQtyButtons();
})();
