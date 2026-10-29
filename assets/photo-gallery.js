"use strict";
(() => {
  const gallery = document.querySelector('.ms-photo-gallery');
  if (!gallery) return;
  const main = gallery.querySelector('.ms-gallery-main');
  const thumbs = [...gallery.querySelectorAll('[data-photo-src]')];
  if (!main || !thumbs.length) return;
  const pictures = thumbs.map(button => ({
    src: button.dataset.photoSrc,
    alt: button.querySelector('img')?.alt || main.alt
  }));
  let current = Math.max(0, thumbs.findIndex(button => button.classList.contains('is-active')));
  const frame = document.createElement('button');
  frame.className = 'ms-gallery-zoom';
  frame.type = 'button';
  frame.setAttribute('aria-label', 'Zväčšiť fotografiu produktu');
  main.parentNode.insertBefore(frame, main);
  frame.append(main);
  const hint = document.createElement('span');
  hint.className = 'ms-gallery-hint';
  hint.textContent = 'Zväčšiť fotografiu';
  hint.setAttribute('aria-hidden', 'true');
  frame.append(hint);
  const svg = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const modal = document.createElement('div');
  modal.className = 'ms-lightbox';
  modal.setAttribute('role','dialog');
  modal.setAttribute('aria-modal','true');
  modal.setAttribute('aria-label','Fotogaléria produktu');
  modal.hidden = true;
  modal.innerHTML = `<div class="ms-lightbox-inner"><div class="ms-lightbox-top"><span class="ms-lightbox-number" aria-live="polite"></span><button type="button" class="ms-lightbox-close" aria-label="Zavrieť galériu">${svg('M5 5l14 14M19 5 5 19')}</button></div><button class="ms-lightbox-arrow ms-lightbox-prev" type="button" aria-label="Predchádzajúca fotografia">${svg('m15 18-6-6 6-6')}</button><div class="ms-lightbox-stage"><img class="ms-lightbox-image" alt="" draggable="false"></div><button class="ms-lightbox-arrow ms-lightbox-next" type="button" aria-label="Nasledujúca fotografia">${svg('m9 18 6-6-6-6')}</button><div class="ms-lightbox-caption"></div></div>`;
  document.body.append(modal);
  const photo = modal.querySelector('.ms-lightbox-image');
  const number = modal.querySelector('.ms-lightbox-number');
  const caption = modal.querySelector('.ms-lightbox-caption');
  const closeButton = modal.querySelector('.ms-lightbox-close');
  const prev = modal.querySelector('.ms-lightbox-prev');
  const next = modal.querySelector('.ms-lightbox-next');
  prev.hidden = next.hidden = pictures.length < 2;
  let lastFocus = null;
  let touchStart = null;
  function select(index) {
    current = (index + pictures.length) % pictures.length;
    const active = pictures[current];
    main.src = active.src;
    main.alt = active.alt;
    photo.src = active.src;
    photo.alt = active.alt;
    caption.textContent = active.alt;
    number.textContent = `${current + 1} / ${pictures.length}`;
    thumbs.forEach((button, i) => {
      const selected = i === current;
      button.classList.toggle('is-active', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  function open() {
    if (!modal.hidden) return;
    lastFocus = document.activeElement;
    select(current);
    modal.hidden = false;
    document.body.classList.add('ms-lightbox-open');
    closeButton.focus();
  }
  function close() {
    if (modal.hidden) return;
    modal.hidden = true;
    document.body.classList.remove('ms-lightbox-open');
    if (lastFocus?.isConnected) lastFocus.focus();
  }
  thumbs.forEach((button, i) => button.addEventListener('click', () => select(i)));
  frame.addEventListener('click', open);
  closeButton.addEventListener('click', close);
  prev.addEventListener('click', () => select(current - 1));
  next.addEventListener('click', () => select(current + 1));
  modal.addEventListener('click', event => { if (event.target === modal) close(); });
  document.addEventListener('keydown', event => {
    if (modal.hidden) return;
    if (event.key === 'Escape') { event.preventDefault(); close(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); select(current - 1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); select(current + 1); }
    if (event.key === 'Tab') {
      const buttons = [closeButton, prev, next].filter(b => !b.hidden);
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  function swipeStart(event) {
    if (event.touches.length !== 1) return;
    touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
  function swipeEnd(event, fromGallery) {
    if (!touchStart || !event.changedTouches.length || pictures.length < 2) { touchStart = null; return; }
    const dx = event.changedTouches[0].clientX - touchStart.x;
    const dy = event.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 43 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      select(current + (dx < 0 ? 1 : -1));
      if (fromGallery) frame.dataset.suppressClick = 'true';
    }
  }
  modal.querySelector('.ms-lightbox-stage').addEventListener('touchstart', swipeStart, { passive: true });
  modal.querySelector('.ms-lightbox-stage').addEventListener('touchend', event => swipeEnd(event, false), { passive: true });
  frame.addEventListener('touchstart', swipeStart, { passive: true });
  frame.addEventListener('touchend', event => swipeEnd(event, true), { passive: true });
  frame.addEventListener('click', event => {
    if (frame.dataset.suppressClick === 'true') { event.stopImmediatePropagation(); frame.dataset.suppressClick = 'false'; }
  }, true);

  const purchase = document.querySelector('.ms-detail-purchase');
  const addButton = purchase?.querySelector('[data-add-product]');
  if (!purchase || !addButton) return;
  const slug = addButton.dataset.addProduct;
  const title = document.querySelector('.pd-intro-col h1')?.textContent.trim() || 'Produkt';
  const prices = globalThis.ModafinilPreviewPricing?.pricesCents || {};
  const sticky = document.createElement('div');
  sticky.className = 'ms-mobile-sticky';
  sticky.hidden = true;
  const label = document.createElement('div');
  label.className = 'ms-mobile-sticky-info';
  const name = document.createElement('strong');
  name.textContent = title;
  const price = document.createElement('span');
  price.textContent = Number.isInteger(prices[slug]) ? globalThis.ModafinilPreviewPricing.money(prices[slug]) + ' / 10 tab.' : '';
  label.append(name, price);
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'ms-mobile-sticky-add';
  add.textContent = 'Pridať do košíka';
  sticky.append(label, add);
  document.body.append(sticky);
  add.addEventListener('click', () => addButton.click());
  const qtyInput = purchase.querySelector('[data-qty-input]');
  function updateQuantity() {
    const quantity = Math.max(1, Math.min(99, Math.trunc(Number(qtyInput?.value || 1)) || 1));
    add.textContent = quantity === 1 ? 'Pridať 10 tabliet' : `Pridať ${quantity*10} tabletiek`;
  }
  document.addEventListener('ms-pricing-updated', event => { if(event.detail.slug===slug){price.textContent=globalThis.ModafinilPreviewPricing.money(event.detail.totalCents);add.textContent=`Pridať ${event.detail.tablets} tabletiek`;}});
  purchase.addEventListener('change', updateQuantity);
  purchase.addEventListener('input', updateQuantity);
  purchase.addEventListener('click', () => requestAnimationFrame(updateQuantity));
  updateQuantity();
  let scheduled = false;
  function updateSticky() {
    scheduled = false;
    const mobile = window.matchMedia('(max-width: 650px)').matches;
    const purchasePassed = purchase.getBoundingClientRect().bottom < 98;
    const blocked = document.body.classList.contains('ms-cart-lock') || document.body.classList.contains('ms-lightbox-open');
    const visible = mobile && purchasePassed && !blocked;
    sticky.hidden = !visible;
    document.body.classList.toggle('ms-sticky-purchase-visible', visible);
  }
  function scheduleSticky() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(updateSticky);
  }
  window.addEventListener('scroll', scheduleSticky, { passive: true });
  window.addEventListener('resize', scheduleSticky, { passive: true });
  new MutationObserver(scheduleSticky).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('click', scheduleSticky);
  scheduleSticky();
})();
