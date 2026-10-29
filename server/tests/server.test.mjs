import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/server.mjs';
let base;
test.before(async()=>{await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));base=`http://127.0.0.1:${app.address().port}`;});
test.after(async()=>{await new Promise(resolve=>app.close(resolve));});
test('public readiness does not reveal secrets',async()=>{
 const r=await fetch(base+'/api/config');const j=await r.json();
 assert.equal(r.status,200);assert.equal(j.ordersEnabled,false);assert.equal(JSON.stringify(j).includes('DATABASE_URL'),false);
});
test('POST order cannot bypass demo lock',async()=>{
 const r=await fetch(base+'/api/orders',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 assert.equal(r.status,503);assert.equal((await r.json()).error,'OBJEDNAVKY_ZATIAL_VYPNUTE');
});
test('Quote refuses unknown price setup',async()=>{
 const r=await fetch(base+'/api/quote',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
 assert.equal(r.status,409);
});
test('Chameleoon requires secret token',async()=>{
 const r=await fetch(base+'/api/chameleoon/shipping-orders');assert.equal(r.status,401);
});
test('Server internals are not exposed',async()=>{
 const r=await fetch(base+'/server/.env.example');assert.equal(r.status,404);
});
test('Store HTML is accessible in demo',async()=>{
 const r=await fetch(base+'/checkout.html');assert.equal(r.status,200);assert.match(await r.text(),/Packeta/);
});
