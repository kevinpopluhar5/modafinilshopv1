import test from 'node:test';
import assert from 'node:assert/strict';
import { readiness, quote, validateCustomer, shippingOrder } from '../src/core.mjs';
import { sfAuthorization } from '../src/superfaktura.mjs';
const sample=[{sku:'future-safe-item',name:'Test item',priceCents:2400,active:true}];
const shipping={homeCents:450,pickupCents:290};
test('orders always locked in demo',()=>{
 const r=readiness({APP_MODE:'demo',ORDERS_ENABLED:'true',LEGAL_PRODUCTS_APPROVED:'true',BUSINESS_APPROVED:'true',TERMS_APPROVED:'true',PRICES_VERIFIED:'true',SHIPPING_PRICES_VERIFIED:'true',DATABASE_URL:'postgresql://example'},sample,shipping);
 assert.equal(r.enabled,false);
});
test('no configured products means locked',()=>{assert.equal(readiness({},[],{homeCents:null,pickupCents:null}).enabled,false)});
test('quote uses server prices and COD',()=>{
 const r=quote({deliveryMethod:'pickup',items:[{sku:'future-safe-item',quantity:2,unitCents:1}]},sample,shipping);
 assert.equal(r.totalCents,5090);assert.equal(r.paymentMethod,'cod');
});
test('duplicate item rejected',()=>assert.throws(()=>quote({deliveryMethod:'home',items:[{sku:'future-safe-item',quantity:1},{sku:'future-safe-item',quantity:2}]},sample,shipping)));
test('unknown item rejected',()=>assert.throws(()=>quote({deliveryMethod:'pickup',items:[{sku:'old-item',quantity:1}]},sample,shipping)));
test('pickup requires point ID and home requires address',()=>{
 const contact={name:'Eva Priklad',email:'eva@example.com',phone:'0911222333'};
 assert.throws(()=>validateCustomer(contact,{method:'pickup',pointId:'',city:'Trnava',postalCode:'91701'}));
 const normalized=validateCustomer(contact,{method:'pickup',pointId:'10001',city:'Trnava',postalCode:'91701'});
 assert.equal(normalized.delivery.pointId,'10001');
});
test('Chameleoon payload has COD and point ID',()=>{
 const p=shippingOrder({orderNumber:'MS-123',createdAt:'2026-10-24T12:00:00Z',status:'new',customer:{name:'Eva Priklad',email:'eva@example.com',phone:'0911222333',company:''},delivery:{method:'pickup',city:'Trnava',postalCode:'91701',pointId:'10001'},totalCents:5090,items:[{sku:'future-safe-item',name:'Test item',quantity:2}]});
 assert.equal(p.codPrice,50.9);assert.equal(p.publicPackagePoint,'10001');assert.equal(p.paymentType,'dobierka');
});
test('SuperFaktura auth encodes identifiers',()=>{
 const v=sfAuthorization({email:'a+b@example.com',apiKey:'sample test',companyId:'7'});
 assert.match(v,/a%2Bb%40example.com/);
});
test('Notification escapes customer supplied HTML',async()=>{
 const { customerMessage } = await import('../src/notifications.mjs');
 const order={orderNumber:'TEST',customer:{name:'<script>alert(1)</script>'},items:[{name:'& test',quantity:1,lineCents:100}],deliveryCents:100,totalCents:200};
 const message=customerMessage(order);
 assert.equal(message.html.includes('<script>'),false);
 assert.match(message.html,/&lt;script&gt;/);
});
