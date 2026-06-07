import { query } from './db';
import { getPostStatus } from './api-auth';

const ENTITY_TABLES = {
  sales: 'sales',
  purchases: 'purchases',
  returns: 'returns',
  collections: 'collections',
  expenses: 'expenses',
  damaged: 'damaged',
  stocktakes: 'stocktakes',
};

function field(record, ...keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
  }
  return null;
}

export async function applySaleEffects(id) {
  const sale = (await query('SELECT * FROM sales WHERE id = ?', [id])).rows[0];
  if (!sale) throw new Error('فاتورة البيع غير موجودة');

  const items = (await query('SELECT * FROM sale_items WHERE saleId = ?', [id])).rows;
  for (const item of items) {
    const productId = field(item, 'productId', 'productid');
    await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, productId]);
  }

  const customerId = field(sale, 'customerId', 'customerid');
  const total = field(sale, 'total') || 0;
  const paidAmount = field(sale, 'paidAmount', 'paidamount') || 0;
  const remaining = total - paidAmount;
  if (remaining > 0 && customerId) {
    await query('UPDATE customers SET balance = balance + ? WHERE id = ?', [remaining, customerId]);
  }
}

export async function reverseSaleEffects(id) {
  const sale = (await query('SELECT * FROM sales WHERE id = ?', [id])).rows[0];
  if (!sale) return;

  const items = (await query('SELECT * FROM sale_items WHERE saleId = ?', [id])).rows;
  for (const item of items) {
    const productId = field(item, 'productId', 'productid');
    await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, productId]);
  }

  const customerId = field(sale, 'customerId', 'customerid');
  const total = field(sale, 'total') || 0;
  const paidAmount = field(sale, 'paidAmount', 'paidamount') || 0;
  const remaining = total - paidAmount;
  if (remaining > 0 && customerId) {
    await query('UPDATE customers SET balance = balance - ? WHERE id = ?', [remaining, customerId]);
  }
}

export async function applyPurchaseEffects(id) {
  const purchase = (await query('SELECT * FROM purchases WHERE id = ?', [id])).rows[0];
  if (!purchase) throw new Error('فاتورة الشراء غير موجودة');

  const items = (await query('SELECT * FROM purchase_items WHERE purchaseId = ?', [id])).rows;
  for (const item of items) {
    const productId = field(item, 'productId', 'productid');
    await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, productId]);
  }

  const supplierId = field(purchase, 'supplierId', 'supplierid');
  const total = field(purchase, 'total') || 0;
  const paidAmount = field(purchase, 'paidAmount', 'paidamount') || 0;
  const remaining = total - paidAmount;
  if (remaining > 0 && supplierId) {
    await query('UPDATE suppliers SET balance = balance + ? WHERE id = ?', [remaining, supplierId]);
  }
}

export async function reversePurchaseEffects(id) {
  const purchase = (await query('SELECT * FROM purchases WHERE id = ?', [id])).rows[0];
  if (!purchase) return;

  const items = (await query('SELECT * FROM purchase_items WHERE purchaseId = ?', [id])).rows;
  for (const item of items) {
    const productId = field(item, 'productId', 'productid');
    await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, productId]);
  }

  const supplierId = field(purchase, 'supplierId', 'supplierid');
  const total = field(purchase, 'total') || 0;
  const paidAmount = field(purchase, 'paidAmount', 'paidamount') || 0;
  const remaining = total - paidAmount;
  if (remaining > 0 && supplierId) {
    await query('UPDATE suppliers SET balance = balance - ? WHERE id = ?', [remaining, supplierId]);
  }
}

export async function applyCollectionEffects(id) {
  const collection = (await query('SELECT * FROM collections WHERE id = ?', [id])).rows[0];
  if (!collection) throw new Error('سند القبض غير موجود');

  const customerId = field(collection, 'customerId', 'customerid');
  const amount = field(collection, 'amount') || 0;
  if (customerId && amount > 0) {
    await query('UPDATE customers SET balance = balance - ? WHERE id = ?', [amount, customerId]);
  }
}

export async function reverseCollectionEffects(id) {
  const collection = (await query('SELECT * FROM collections WHERE id = ?', [id])).rows[0];
  if (!collection) return;

  const customerId = field(collection, 'customerId', 'customerid');
  const amount = field(collection, 'amount') || 0;
  if (customerId && amount > 0) {
    await query('UPDATE customers SET balance = balance + ? WHERE id = ?', [amount, customerId]);
  }
}

export async function applyReturnEffects(id) {
  const returnRecord = (await query('SELECT * FROM returns WHERE id = ?', [id])).rows[0];
  if (!returnRecord) throw new Error('المرتجع غير موجود');

  const type = field(returnRecord, 'type');
  const entityId = field(returnRecord, 'entityId', 'entityid');
  const total = field(returnRecord, 'total') || 0;
  const items = (await query('SELECT * FROM return_items WHERE returnId = ?', [id])).rows;

  for (const item of items) {
    const productId = field(item, 'productId', 'productid');
    if (type === 'supplier') {
      await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, productId]);
    } else {
      await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, productId]);
    }
  }

  if (type === 'supplier' && entityId && total > 0) {
    await query('UPDATE suppliers SET balance = balance - ? WHERE id = ?', [total, entityId]);
  } else if (type === 'customer' && entityId && total > 0) {
    await query('UPDATE customers SET balance = balance - ? WHERE id = ?', [total, entityId]);
  }
}

export async function reverseReturnEffects(id) {
  const returnRecord = (await query('SELECT * FROM returns WHERE id = ?', [id])).rows[0];
  if (!returnRecord) return;

  const type = field(returnRecord, 'type');
  const entityId = field(returnRecord, 'entityId', 'entityid');
  const total = field(returnRecord, 'total') || 0;
  const items = (await query('SELECT * FROM return_items WHERE returnId = ?', [id])).rows;

  for (const item of items) {
    const productId = field(item, 'productId', 'productid');
    if (type === 'supplier') {
      await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, productId]);
    } else {
      await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, productId]);
    }
  }

  if (type === 'supplier' && entityId && total > 0) {
    await query('UPDATE suppliers SET balance = balance + ? WHERE id = ?', [total, entityId]);
  } else if (type === 'customer' && entityId && total > 0) {
    await query('UPDATE customers SET balance = balance + ? WHERE id = ?', [total, entityId]);
  }
}

export async function applyDamagedEffects(id) {
  const damaged = (await query('SELECT * FROM damaged WHERE id = ?', [id])).rows[0];
  if (!damaged) throw new Error('سجل التالف غير موجود');

  const productId = field(damaged, 'productId', 'productid');
  const qty = field(damaged, 'qty') || 0;
  if (productId && qty > 0) {
    await query('UPDATE products SET qty = qty - ? WHERE id = ?', [qty, productId]);
  }
}

export async function reverseDamagedEffects(id) {
  const damaged = (await query('SELECT * FROM damaged WHERE id = ?', [id])).rows[0];
  if (!damaged) return;

  const productId = field(damaged, 'productId', 'productid');
  const qty = field(damaged, 'qty') || 0;
  if (productId && qty > 0) {
    await query('UPDATE products SET qty = qty + ? WHERE id = ?', [qty, productId]);
  }
}

export async function applyStocktakeEffects(id) {
  const stocktake = (await query('SELECT * FROM stocktakes WHERE id = ?', [id])).rows[0];
  if (!stocktake) throw new Error('سجل الجرد غير موجود');

  const productId = field(stocktake, 'productId', 'productid');
  const physicalQty = field(stocktake, 'physicalQty', 'physicalqty');
  const difference = field(stocktake, 'difference') || 0;
  if (productId && difference !== 0 && physicalQty !== null) {
    await query('UPDATE products SET qty = ? WHERE id = ?', [physicalQty, productId]);
  }
}

export async function reverseStocktakeEffects(id) {
  const stocktake = (await query('SELECT * FROM stocktakes WHERE id = ?', [id])).rows[0];
  if (!stocktake) return;

  const productId = field(stocktake, 'productId', 'productid');
  const systemQty = field(stocktake, 'systemQty', 'systemqty');
  if (productId && systemQty !== null) {
    await query('UPDATE products SET qty = ? WHERE id = ?', [systemQty, productId]);
  }
}

const APPLY_HANDLERS = {
  sales: applySaleEffects,
  purchases: applyPurchaseEffects,
  collections: applyCollectionEffects,
  returns: applyReturnEffects,
  damaged: applyDamagedEffects,
  stocktakes: applyStocktakeEffects,
  expenses: async () => {},
};

const REVERSE_HANDLERS = {
  sales: reverseSaleEffects,
  purchases: reversePurchaseEffects,
  collections: reverseCollectionEffects,
  returns: reverseReturnEffects,
  damaged: reverseDamagedEffects,
  stocktakes: reverseStocktakeEffects,
  expenses: async () => {},
};

export async function postRecord(entity, id, user) {
  const table = ENTITY_TABLES[entity];
  if (!table) throw new Error('نوع العملية غير مدعوم');

  const record = (await query(`SELECT * FROM ${table} WHERE id = ?`, [id])).rows[0];
  if (!record) throw new Error('العملية غير موجودة');
  if (getPostStatus(record) === 'posted') throw new Error('العملية مرحّلة مسبقاً');

  const apply = APPLY_HANDLERS[entity];
  if (apply) await apply(id);

  await query(
    `UPDATE ${table} SET postStatus = ?, postedBy = ?, postedByName = ?, postedAt = datetime('now') WHERE id = ?`,
    ['posted', user?.id || null, user?.fullName || null, id]
  );
}

export async function reverseRecordEffects(entity, id) {
  const reverse = REVERSE_HANDLERS[entity];
  if (reverse) await reverse(id);
}

export function resolveInitialPostStatus(user) {
  return user?.role === 'admin' ? 'posted' : 'pending';
}
