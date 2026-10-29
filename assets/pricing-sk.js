"use strict";
(() => {
  const prices = {"modaxl-200":3300,"modawake":2900,"modacare-200":3000,"modacare-300":3400,"armodacare-150":3100,"armodacare-250":3400,"modalert-200":3100,"waklert":3400,"modvigil-200":2800,"artvigil":2800};
  const discount = packs => packs >= 10 ? 20 : packs >= 5 ? 15 : packs >= 3 ? 10 : packs >= 2 ? 5 : 0;
  const money = cents => `${(cents / 100).toFixed(2).replace('.', ',')} €`;
  const line = (slug, packs) => {
    if (!Object.hasOwn(prices, slug) || !Number.isInteger(packs) || packs < 1 || packs > 99) return null;
    const baseCents = prices[slug] * packs;
    const percent = discount(packs);
    const totalCents = Math.round(baseCents * (100 - percent) / 100);
    return {slug,packs,tablets:packs * 10,unitCents:prices[slug],baseCents,discountPercent:percent,totalCents,savedCents:baseCents-totalCents};
  };
  const total = (cart, shippingCents = 390) => {
    const rows=Object.entries(cart).map(([slug,packs])=>line(slug,packs)).filter(Boolean);
    return {rows,tabletCount:rows.reduce((n,r)=>n+r.tablets,0),packCount:rows.reduce((n,r)=>n+r.packs,0),subtotalCents:rows.reduce((n,r)=>n+r.totalCents,0),savingsCents:rows.reduce((n,r)=>n+r.savedCents,0),shippingCents,totalCents:rows.reduce((n,r)=>n+r.totalCents,0)+(rows.length?shippingCents:0)};
  };
  const api=Object.freeze({market:'SK',currency:'EUR',tabletsPerPack:10,pricesCents:Object.freeze(prices),shippingCents:Object.freeze({home:390,pickup:390}),packs:Object.freeze([1,2,3,5,10]),discount,line,total,money});
  globalThis.ModafinilPreviewPricing=api;
})();
