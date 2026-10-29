const assert = require('node:assert/strict');
const {test} = require('node:test');
require('../assets/pricing-sk.js');
const p=globalThis.ModafinilPreviewPricing;
const expected={
  'modalert-200':3100,'modvigil-200':2800,'waklert':3400,'artvigil':2800,
  'modacare-200':3000,'modacare-300':3400,'armodacare-250':3400,
  'armodacare-150':3100,'modawake':2900,'modaxl-200':3300
};
test('all SK demo base prices are cents and match input',()=>assert.deepEqual(p.pricesCents,expected));
test('exactly five offered package quantities',()=>assert.deepEqual(p.packs,[1,2,3,5,10]));
test('discount tiers by pack quantity',()=>{
  const tiers=[[1,0],[2,5],[3,10],[4,10],[5,15],[9,15],[10,20],[99,20]];
  for(const [count,percent] of tiers)assert.equal(p.discount(count),percent);
});
test('prices and savings rounded to cents per line',()=>{
  assert.equal(p.line('modaxl-200',5).totalCents,14025);
  assert.equal(p.line('modaxl-200',5).savedCents,2475);
  assert.equal(p.line('modaxl-200',10).totalCents,26400);
  assert.equal(p.line('modacare-300',4).totalCents,12240);
});
test('both Slovakia delivery methods are 390 cents',()=>assert.deepEqual(p.shippingCents,{home:390,pickup:390}));
test('cart applies discounts per distinct product and adds shipping once',()=>{
  const result=p.total({'modaxl-200':2,'modacare-300':5});
  assert.equal(result.tabletCount,70);
  assert.equal(result.subtotalCents,20720);
  assert.equal(result.savingsCents,2880);
  assert.equal(result.totalCents,21110);
});
test('invalid quantities and unknown SK products rejected',()=>{
  for(const n of [0,-1,2.5,100,'2'])assert.equal(p.line('modaxl-200',n),null);
  assert.equal(p.line('missing',1),null);
});
