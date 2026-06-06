import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
        const returns = (await query('SELECT * FROM returns ORDER BY date DESC')).rows;
    const returnItems = (await query('SELECT * FROM return_items')).rows;
    
    const returnsWithItems = returns.map(r => ({
      ...r,
      items: returnItems.filter(i => i.returnId === r.id)
    }));
    return NextResponse.json({ returns: returnsWithItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
        const { type, entityId, entityName, date, reason, total, items } = data;
    const id = 'RET-' + Date.now();
    
    const insertReturn = (await query('INSERT INTO returns (id, type, entityId, entityName, date, reason, total) VALUES (?,?,?,?,?,?,?)');
    const insertItem = db.prepare('INSERT INTO return_items (returnId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)');
    // If supplier return, decrease product qty
    const updateProduct = db.prepare('UPDATE products SET qty = qty - ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      insertReturn.run(id, type, entityId, entityName, date, reason || '', total || 0);
      if (items && Array.isArray(items)) {
        for (const item of items) {
          insertItem.run(id, item.productId, item.productName, item.qty, item.price, item.qty * item.price);
          if (type === 'supplier') {
            updateProduct.run(item.qty, item.productId);
          }
        }
      }
    });
    transaction();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        
    const returnRecord = db.prepare('SELECT type FROM returns WHERE id=?', [id])).rows[0];
    const getItems = db.prepare('SELECT * FROM return_items WHERE returnId=?');
    const items = getItems.all(id);
    const deleteReturn = db.prepare('DELETE FROM returns WHERE id=?');
    const deleteItems = db.prepare('DELETE FROM return_items WHERE returnId=?');
    const updateProduct = db.prepare('UPDATE products SET qty = qty + ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      if (returnRecord?.type === 'supplier') {
        for (const item of items) {
          updateProduct.run(item.qty, item.productId);
        }
      }
      deleteItems.run(id);
      deleteReturn.run(id);
    });
    transaction();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
