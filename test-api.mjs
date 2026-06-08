const base = 'http://127.0.0.1:3001';

async function run() {
  console.log('Testing GET /api/products');
  let res = await fetch(`${base}/api/products`);
  let data = await res.json();
  console.log('GET products status', res.status, 'count', Array.isArray(data.products) ? data.products.length : 'invalid');

  console.log('Testing POST /api/products');
  res = await fetch(`${base}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Test Product', sku: 'SKU-TEST-999', category: 'اختبار', qty: 1, purchasePrice: 10, sellPrice: 15, expiryDate: '2027-01-01', threshold: 1 })
  });
  data = await res.json();
  console.log('POST products status', res.status, 'body', data);
  if (!data.id) throw new Error('POST did not return id');

  const createdId = data.id;
  console.log('Testing DELETE /api/products?id=' + createdId);
  res = await fetch(`${base}/api/products?id=${createdId}`, { method: 'DELETE' });
  data = await res.json();
  console.log('DELETE products status', res.status, 'body', data);
  if (!data.success) throw new Error('DELETE failed');

  console.log('API tests passed');
}

run().catch((err) => {
  console.error('API test error:', err);
  process.exit(1);
});