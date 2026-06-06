import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const returns = (await query('SELECT * FROM returns ORDER BY date DESC')).rows;
    const returnItems = (await query('SELECT * FROM return_items')).rows;
    
    const returnsWithItems = returns.map(r => ({
      ...r,
      items: returnItems.filter(i => i.returnid === r.id)
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
    
    await query('INSERT INTO returns (id, type, entityId, entityName, date, reason, total) VALUES (?,?,?,?,?,?,?)', [id, type, entityId, entityName, date, reason || '', total || 0]);
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query('INSERT INTO return_items (returnId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]);
        if (type === 'supplier') {
          await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, item.productId]);
        }
      }
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const returnRecord = (await query('SELECT type FROM returns WHERE id=?', [id])).rows[0];
    const items = (await query('SELECT * FROM return_items WHERE returnId=?', [id])).rows;
    
    if (returnRecord?.type === 'supplier') {
      for (const item of items) {
        await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, item.productid]);
      }
    }
    await query('DELETE FROM return_items WHERE returnId=?', [id]);
    await query('DELETE FROM returns WHERE id=?', [id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
