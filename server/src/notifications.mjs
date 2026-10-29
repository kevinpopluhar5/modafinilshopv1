const html = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const euro = cents => `${(cents / 100).toFixed(2).replace('.', ',')} €`;
export function customerMessage(order) {
  const rows = order.items.map(item => `<tr><td>${html(item.name)}</td><td>${item.quantity} ks</td><td>${euro(item.lineCents)}</td></tr>`).join('');
  return {
    subject: `Potvrdenie objednávky ${html(order.orderNumber)}`,
    html: `<main style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:28px;color:#151e30"><h1>Potvrdenie objednávky</h1><p>Ďakujeme, ${html(order.customer.name)}. Objednávka č. <strong>${html(order.orderNumber)}</strong> bola zaevidovaná.</p><table style="width:100%;border-collapse:collapse"><thead><tr><th align="left">Produkt</th><th>Kusy</th><th>Cena</th></tr></thead><tbody>${rows}</tbody></table><p>Doručenie: ${euro(order.deliveryCents)}. Celkom: <strong>${euro(order.totalCents)}</strong>.</p><p>Spôsob platby: dobierka.</p></main>`
  };
}
export function operatorMessage(order) {
  return {
    subject:`Nová objednávka ${html(order.orderNumber)}`,
    html:`<main style="font-family:Arial,sans-serif;padding:24px"><h1>Objednávka ${html(order.orderNumber)}</h1><p>${html(order.customer.name)} · ${html(order.customer.email)} · ${html(order.customer.phone)}</p><p>Doprava: ${html(order.delivery.method)} · ${html(order.delivery.pointId || order.delivery.address)} · ${html(order.delivery.city)}</p><p>Dobierka: ${euro(order.totalCents)}</p></main>`
  };
}
