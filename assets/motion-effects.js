"use strict";
(() => {
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const selectors = ['.product-grid .card','.why-intro','.why-card','.section-head','.pd-picture-card','.pd-content-heading','.detail-section-row','.pd-related-heading','.pd-related-card','.faq-item'];
  const nodes = [...document.querySelectorAll(selectors.join(','))];
  if (!nodes.length) return;
  nodes.forEach(node => {
    const parent = node.parentElement;
    const siblings = [...parent.children].filter(el => el.matches(node.tagName === 'ARTICLE' ? '.card,.why-card,.pd-related-card' : '.detail-section-row,.faq-item'));
    const index = siblings.indexOf(node);
    node.style.setProperty('--ms-stagger', `${Math.max(0,index % 5) * 65}ms`);
    node.classList.add('ms-reveal');
  });
  document.documentElement.classList.add('ms-motion-ready');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  }, { rootMargin: '0px 0px 60px 0px', threshold: .05 });
  nodes.forEach(node => observer.observe(node));
})();
