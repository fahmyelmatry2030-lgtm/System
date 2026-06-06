import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const purchases = db.prepare('SELECT * FROM purchases ORDER BY createdAt DESC').all();
    const purchaseItems = db.prepare('SELECT * FROM purchase_items').all();
    
    const purchasesWithItems = purchases.map(p => ({
      ...p,
      items: purchaseItems.filter(i => i.purchaseId === p.id)
    }));
    return NextResponse.json({ purchases: purchasesWithItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const { supplierId, supplierName, date, total, paidAmount, items } = data;
    const id = 'INV-P' + Date.now();
    
    const insertPurchase = db.prepare('INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount) VALUES (?,?,?,?,?,?)');
    const insertItem = db.prepare('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)');
    const updateProduct = db.prepare('UPDATE products SET qty = qty + ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      insertPurchase.run(id, supplierId, supplierName, date, total || 0, paidAmount || 0);
      if (items && Array.isArray(items)) {
        for (const item of items) {
          insertItem.run(id, item.productId, item.productName, item.qty, item.price, item.qty * item.price);
          updateProduct.run(item.qty, item.productId);
        }
      }
    });
    transaction();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const { id, supplierId, supplierName, date, total, paidAmount } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const stmt = db.prepare('UPDATE purchases SET supplierId=?, supplierName=?, date=?, total=?, paidAmount=? WHERE id=?');
    stmt.run(supplierId, supplierName, date, total, paidAmount, id);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    const db = getDb();
    
    const getItems = db.prepare('SELECT * FROM purchase_items WHERE purchaseId=?');
    const items = getItems.all(id);
    const deletePurchase = db.prepare('DELETE FROM purchases WHERE id=?');
    const deleteItems = db.prepare('DELETE FROM purchase_items WHERE purchaseId=?');
    const updateProduct = db.prepare('UPDATE products SET qty = qty - ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      for (const item of items) {
        updateProduct.run(item.qty, item.productId);
      }
      deleteItems.run(id);
      deletePurchase.run(id);
    });
    transaction();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
