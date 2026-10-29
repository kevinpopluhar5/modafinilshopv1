let pool;
export async function database(url) {
  if (!pool) {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 12000, connectionTimeoutMillis: 5000 });
  }
  return pool;
}
export async function createOrder(url, order) {
  const db = await database(url);
  const sql = `INSERT INTO shop_orders(id,order_number,idempotency_key,customer,delivery,items,subtotal_cents,delivery_cents,total_cents) VALUES ($1,$2,$3,$4::jsonb,$5::jsonb,$6::jsonb,$7,$8,$9) ON CONFLICT (idempotency_key) DO NOTHING RETURNING order_number`;
  const values = [order.id,order.orderNumber,order.idempotencyKey,JSON.stringify(order.customer),JSON.stringify(order.delivery),JSON.stringify(order.items),order.subtotalCents,order.deliveryCents,order.totalCents];
  const result = await db.query(sql, values);
  if (result.rows[0]) return result.rows[0];
  const existing = await db.query('SELECT order_number FROM shop_orders WHERE idempotency_key=$1', [order.idempotencyKey]);
  return existing.rows[0];
}
export async function findOrder(url, id) {
  const db = await database(url);
  const result = await db.query('SELECT * FROM shop_orders WHERE order_number=$1 LIMIT 1',[id]);
  return result.rows[0] || null;
}
export async function listOrders(url, start, end) {
  const db = await database(url);
  const result = await db.query('SELECT * FROM shop_orders WHERE created_at >= $1 AND created_at < $2 ORDER BY created_at DESC LIMIT 100',[start,end]);
  return result.rows;
}
export async function setShipment(url, id, state, number) {
  const db = await database(url);
  const result = await db.query('UPDATE shop_orders SET status=COALESCE($2,status),shipping_number=COALESCE($3,shipping_number) WHERE order_number=$1 RETURNING id',[id,state,number]);
  return Boolean(result.rows.length);
}
export function normalizeDbOrder(row) {
  return { id:row.id,orderNumber:row.order_number,createdAt:row.created_at, status:row.status,customer:row.customer,delivery:row.delivery,items:row.items,subtotalCents:row.subtotal_cents,deliveryCents:row.delivery_cents,totalCents:row.total_cents,shippingNumber:row.shipping_number };
}
