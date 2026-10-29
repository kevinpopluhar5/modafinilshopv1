import { randomUUID } from 'node:crypto';

export function readiness(env, catalog, shipping) {
  const configured = catalog.length > 0 && catalog.every(p => p.active && Number.isInteger(p.priceCents) && p.priceCents >= 0 && p.name && p.sku);
  const transport = Number.isInteger(shipping.homeCents) && shipping.homeCents >= 0 && Number.isInteger(shipping.pickupCents) && shipping.pickupCents >= 0;
  const checks = {
    approvedProducts: env.LEGAL_PRODUCTS_APPROVED === 'true',
    approvedBusiness: env.BUSINESS_APPROVED === 'true',
    approvedTerms: env.TERMS_APPROVED === 'true',
    verifiedPrices: env.PRICES_VERIFIED === 'true' && configured,
    verifiedShipping: env.SHIPPING_PRICES_VERIFIED === 'true' && transport,
    secureDatabase: Boolean(env.DATABASE_URL),
    explicitlyActivated: env.ORDERS_ENABLED === 'true' && env.APP_MODE === 'live'
  };
  return { enabled: Object.values(checks).every(Boolean), checks };
}

export function amountText(cents) {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}

export function quote(input, catalog, shipping) {
  if (!Array.isArray(input?.items) || input.items.length === 0 || input.items.length > 30) throw new Error('INVALID_ITEMS');
  if (!['home', 'pickup'].includes(input.deliveryMethod)) throw new Error('INVALID_DELIVERY');
  const products = new Map(catalog.filter(p => p.active).map(p => [p.sku, p]));
  const seen = new Set();
  let count = 0;
  let subtotalCents = 0;
  const items = input.items.map(row => {
    const sku = row?.sku;
    const quantity = row?.quantity;
    if (typeof sku !== 'string' || seen.has(sku) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) throw new Error('INVALID_ITEMS');
    seen.add(sku);
    const product = products.get(sku);
    if (!product || !Number.isInteger(product.priceCents)) throw new Error('PRODUCT_UNAVAILABLE');
    count += quantity;
    if (count > 99) throw new Error('QUANTITY_LIMIT');
    const lineCents = quantity * product.priceCents;
    subtotalCents += lineCents;
    return { sku, name: product.name, quantity, unitCents: product.priceCents, lineCents, image: product.image || null };
  });
  const deliveryCents = input.deliveryMethod === 'home' ? shipping.homeCents : shipping.pickupCents;
  if (!Number.isInteger(deliveryCents) || deliveryCents < 0) throw new Error('SHIPPING_NOT_CONFIGURED');
  if (subtotalCents > 10_000_000) throw new Error('AMOUNT_LIMIT');
  return { items, itemCount: count, subtotalCents, deliveryCents, totalCents: subtotalCents + deliveryCents, currency: 'EUR', paymentMethod: 'cod' };
}

export function validateCustomer(customer, delivery) {
  const clean = value => typeof value === 'string' ? value.trim() : '';
  const name = clean(customer?.name), email = clean(customer?.email), phone = clean(customer?.phone);
  if (name.length < 3 || name.length > 130 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180 || phone.length < 7 || phone.length > 26) throw new Error('INVALID_CUSTOMER');
  if (!['home', 'pickup'].includes(delivery?.method)) throw new Error('INVALID_DELIVERY');
  const home = delivery.method === 'home';
  const address = home ? clean(delivery.address) : '';
  const pointId = home ? '' : clean(delivery.pointId);
  if (home && (address.length < 5 || address.length > 220)) throw new Error('INVALID_ADDRESS');
  if (!home && (!/^[A-Za-z0-9_-]{1,40}$/.test(pointId) || pointId.length > 40)) throw new Error('INVALID_PICKUP_POINT');
  const city = clean(delivery.city), postalCode = clean(delivery.postalCode);
  if (!city || !postalCode || city.length > 110 || postalCode.length > 14) throw new Error('INVALID_DELIVERY_ADDRESS');
  return { customer: { name, email, phone, company: clean(customer?.company).slice(0,120) }, delivery: { method: delivery.method, address, city, postalCode, countryCode: 'SK', pointId, pointName: clean(delivery.pointName).slice(0,150) } };
}

export function shippingOrder(order) {
  const d = order.delivery;
  return {
    addressee: order.customer.name, organizationName: order.customer.company || null,
    street: d.method === 'home' ? d.address : null, streetDetail: null,
    phone: order.customer.phone, email: order.customer.email, city: d.city,
    zipCode: d.postalCode, countryCode: 'SK', note: null,
    referenceNumber: order.orderNumber, courierService: 'packeta', weight: null,
    packageCount: null, codPrice: order.totalCents / 100, stateId: order.status,
    createDateTime: new Date(order.createdAt).toISOString().slice(0,19),
    publicPackagePoint: d.method === 'pickup' ? d.pointId : null,
    isBackShipping: false, orderedShippingDate: null, currency: 'EUR',
    driverNote: null, contactPerson: null, variableSymbol: null,
    description: 'Zásielka', documentType: 'order', paymentType: 'dobierka',
    totalPrice: order.totalCents / 100,
    items: order.items.map(row => ({ id: row.sku, code: row.sku, eanCode: null, name: row.name, text: null, quantity: row.quantity, measureUnit: 'ks' }))
  };
}

export function invoiceDraft(order) {
  return {
    reference: order.orderNumber, currency: 'EUR', paymentMethod: 'cod',
    customer: order.customer,
    items: order.items.map(i => ({ sku: i.sku, name: i.name, quantity: i.quantity, unitCents: i.unitCents })),
    shippingCents: order.deliveryCents, amountCents: order.totalCents,
    status: 'draft_review_required', id: randomUUID()
  };
}
