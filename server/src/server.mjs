import http from 'node:http';
import { readFileSync, existsSync, createReadStream } from 'node:fs';
import { resolve, dirname, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingSafeEqual, randomUUID } from 'node:crypto';
import { readiness, quote, validateCustomer, shippingOrder, invoiceDraft } from './core.mjs';
import { createOrder, findOrder, listOrders, setShipment, normalizeDbOrder } from './store.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const serverRoot = resolve(root, 'server');
const loadEnv = () => {
  const result = { ...process.env };
  const envFile = resolve(serverRoot, '.env');
  if (!existsSync(envFile)) return result;
  for (const line of readFileSync(envFile,'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
    if (match && result[match[1]] === undefined) result[match[1]] = match[2].replace(/^['"]|['"]$/g,'');
  }
  return result;
};
const settings = loadEnv();
const jsonFile = (name, fallback) => {
  const input = settings[name] || fallback;
  const path = resolve(serverRoot, input);
  if (!path.startsWith(serverRoot + sep)) throw new Error('CONFIG_PATH_INVALID');
  return JSON.parse(readFileSync(path,'utf8'));
};
const catalog = jsonFile('CATALOG_PATH','settings/catalog.example.json');
const shipping = jsonFile('SHIPPING_PATH','settings/shipping.example.json');
const ready = readiness(settings, catalog, shipping);
const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff' });
  res.end(JSON.stringify(data));
};
const auth = (given, expected) => {
  if (!given || !expected || typeof given !== 'string') return false;
  const a = Buffer.from(given), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a,b);
};
const guarded = (req, expected) => auth(req.headers.authorization?.replace(/^Bearer /,''),expected);
const getBody = async req => {
  if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) throw new Error('JSON_REQUIRED');
  let value = '';
  for await (const chunk of req) {
    value += chunk.toString('utf8');
    if (value.length > 32768) throw new Error('BODY_TOO_LARGE');
  }
  return JSON.parse(value);
};
const sameOrigin = req => {
  const origin = req.headers.origin;
  if (!origin) return false;
  try {
    const normalized = new URL(origin);
    const expected = settings.PUBLIC_ORIGIN || `http://${req.headers.host}`;
    return normalized.origin === new URL(expected).origin;
  } catch { return false; }
};
const mime = { '.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'application/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.txt':'text/plain; charset=utf-8','.ico':'image/x-icon','.xml':'application/xml' };
const traffic = new Map();
const limited = req => {
  const address = req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const slot = traffic.get(address);
  const next = slot && now-slot.start<60000 ? { start: slot.start, count:slot.count+1 } : { start:now,count:1 };
  traffic.set(address,next);
  return next.count>45;
};
const errorStatus = message => /NOT_CONFIGURED|PRODUCT_UNAVAILABLE|SHIPPING_NOT_CONFIGURED/.test(message) ? 409 : 400;
async function route(req,res) {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const path = url.pathname;
  if (path.startsWith('/api/')) {
    if (limited(req)) return json(res,429,{error:'TOO_MANY_REQUESTS'});
    if (req.method==='GET' && path==='/api/health') return json(res,200,{ok:true,mode:settings.APP_MODE||'demo'});
    if (req.method==='GET' && path==='/api/config') return json(res,200,{mode:settings.APP_MODE||'demo',ordersEnabled:ready.enabled,pricesReady:ready.checks.verifiedPrices,shippingReady:ready.checks.verifiedShipping,packetaWidgetKey:settings.PACKETA_WIDGET_KEY||null,payment:'dobierka',fulfillmentProvider:'chameleoon'});
    if (req.method==='GET' && path==='/api/catalog') return json(res,200,{products:ready.enabled ? catalog.filter(p=>p.active).map(({sku,name,priceCents,image})=>({sku,name,priceCents,image})) : []});
    if (req.method==='POST' && path==='/api/quote') {
      if (!ready.checks.verifiedPrices || !ready.checks.verifiedShipping) return json(res,409,{error:'CENY_ESTE_NEKONFIGUROVANE'});
      try { return json(res,200,quote(await getBody(req),catalog,shipping)); }
      catch(e){ return json(res,errorStatus(e.message),{error:e.message}); }
    }
    if (req.method==='POST' && path==='/api/orders') {
      if (!ready.enabled) return json(res,503,{error:'OBJEDNAVKY_ZATIAL_VYPNUTE'});
      if (!sameOrigin(req)) return json(res,403,{error:'INVALID_ORIGIN'});
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(req.headers['idempotency-key']||''))) return json(res,400,{error:'IDEMPOTENCY_REQUIRED'});
      try {
        const body = await getBody(req);
        if (body.privacyAcknowledged !== true || body.paymentMethod !== 'cod') throw new Error('INVALID_CONFIRMATION');
        const normalized = validateCustomer(body.customer, body.delivery);
        const amounts = quote({items:body.items,deliveryMethod:normalized.delivery.method},catalog,shipping);
        const order = { ...normalized, ...amounts, id:randomUUID(), idempotencyKey:req.headers['idempotency-key'],orderNumber:`MS-${Date.now()}-${randomUUID().slice(0,8).toUpperCase()}` };
        const saved = await createOrder(settings.DATABASE_URL,order);
        return json(res,201,{orderNumber:saved.order_number,status:'received'});
      } catch(e){ const known=/^(INVALID_|PRODUCT_UNAVAILABLE|QUANTITY_LIMIT|AMOUNT_LIMIT|SHIPPING_NOT_CONFIGURED)/.test(e.message); return json(res,known?errorStatus(e.message):503,{error:known?e.message:'ORDER_UNAVAILABLE'}); }
    }
    if (path.startsWith('/api/chameleoon/') && !guarded(req,settings.CHAMELEOON_SHARED_TOKEN)) return json(res,401,{error:'UNAUTHORIZED'});
    if (path.startsWith('/api/chameleoon/') && !ready.enabled) return json(res,503,{error:'FULFILLMENT_DISABLED'});
    if (req.method==='GET' && path==='/api/chameleoon/shipping-orders/available-states') return json(res,200,[{value:'new',name:'Nová'},{value:'packed',name:'Zabalená'},{value:'shipped',name:'Odoslaná'},{value:'cancelled',name:'Zrušená'}]);
    if (req.method==='GET' && path==='/api/chameleoon/shipping-orders') {
      const start = url.searchParams.get('date_from'), end = url.searchParams.get('date_to');
      if (!start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end)<Date.parse(start) || Date.parse(end)-Date.parse(start)>31*86400000) return json(res,400,{error:'INVALID_DATES'});
      try { const rows=await listOrders(settings.DATABASE_URL,start,end); return json(res,200,rows.map(x=>shippingOrder(normalizeDbOrder(x)))); } catch { return json(res,503,{error:'DATABASE_UNAVAILABLE'}); }
    }
    const getOrder = path.match(/^\/api\/chameleoon\/shipping-orders\/([A-Za-z0-9-]{1,80})$/);
    if (req.method==='GET' && getOrder) {
      const row=await findOrder(settings.DATABASE_URL,getOrder[1]);
      return row ? json(res,200,shippingOrder(normalizeDbOrder(row))) : json(res,404,{error:'NOT_FOUND'});
    }
    const putOrder = path.match(/^\/api\/chameleoon\/orders\/([A-Za-z0-9-]{1,80})$/);
    if (req.method==='PUT' && putOrder) {
      try {
        const input=await getBody(req);
        const state=typeof input.targetState==='string' && ['new','packed','shipped','cancelled'].includes(input.targetState) ? input.targetState : null;
        const shippingNumber=typeof input.shippingNumber==='string' && input.shippingNumber.length<=120 ? input.shippingNumber : null;
        if (!state && !shippingNumber) return json(res,400,{error:'NO_UPDATE'});
        const updated=await setShipment(settings.DATABASE_URL,putOrder[1],state,shippingNumber);
        return updated ? json(res,204,null) : json(res,404,{error:'NOT_FOUND'});
      } catch { return json(res,400,{error:'INVALID_UPDATE'}); }
    }
    if (req.method==='GET' && path==='/api/admin/orders') {
      if (!guarded(req,settings.ADMIN_SHARED_TOKEN)) return json(res,401,{error:'UNAUTHORIZED'});
      if (!ready.enabled) return json(res,503,{error:'ADMIN_ORDERS_DISABLED'});
      const start=url.searchParams.get('date_from'),end=url.searchParams.get('date_to');
      if (!start || !end || !Number.isFinite(Date.parse(start)) || !Number.isFinite(Date.parse(end)) || Date.parse(end)-Date.parse(start)>31*86400000) return json(res,400,{error:'INVALID_DATES'});
      const rows=await listOrders(settings.DATABASE_URL,start,end);
      return json(res,200,rows.map(normalizeDbOrder));
    }
    if (req.method==='GET' && path.startsWith('/api/admin/invoice-draft/')) {
      if (!guarded(req,settings.ADMIN_SHARED_TOKEN)) return json(res,401,{error:'UNAUTHORIZED'});
      if (!ready.enabled) return json(res,503,{error:'INVOICING_DISABLED'});
      const id=path.split('/').at(-1);
      if (!/^[A-Za-z0-9-]{1,80}$/.test(id)) return json(res,400,{error:'INVALID_ID'});
      const row=await findOrder(settings.DATABASE_URL,id);
      return row ? json(res,200,invoiceDraft(normalizeDbOrder(row))) : json(res,404,{error:'NOT_FOUND'});
    }
    return json(res,404,{error:'NOT_FOUND'});
  }
  if (req.method!=='GET' && req.method!=='HEAD') return json(res,405,{error:'METHOD_NOT_ALLOWED'});
  let requested;
  try { requested=decodeURIComponent(path); } catch { return json(res,400,{error:'BAD_PATH'}); }
  if (requested.includes('..') || requested.includes('\\') || requested.includes('\0')) return json(res,403,{error:'FORBIDDEN'});
  if (requested==='/' || requested==='') requested='/index.html';
  if (requested.startsWith('/server/') || requested.startsWith('/tests/') || requested.startsWith('/content/') || requested.split('/').some(part=>part.startsWith('.'))) return json(res,404,{error:'NOT_FOUND'});
  const file=resolve(root,'.'+requested);
  if (!file.startsWith(root+sep)) return json(res,404,{error:'NOT_FOUND'});
  const type=mime[extname(file).toLowerCase()];
  if (!type || !existsSync(file)) return json(res,404,{error:'NOT_FOUND'});
  res.writeHead(200,{'Content-Type':type,'X-Content-Type-Options':'nosniff','X-Frame-Options':'SAMEORIGIN','Cache-Control':extname(file)==='.html'?'no-cache':'public,max-age=300'});
  if(req.method==='HEAD') return res.end();
  createReadStream(file).pipe(res);
}
const host=settings.HOST || '127.0.0.1';
const port=Number(settings.PORT||3000);
const app=http.createServer((req,res)=>{ route(req,res).catch(()=>json(res,500,{error:'SERVER_ERROR'})); });
if (process.argv[1] === fileURLToPath(import.meta.url)) app.listen(port,host,()=>{process.stdout.write(`Listening ${host}:${port} ${ready.enabled?'live':'demo'}\n`);});
export { app, ready };
