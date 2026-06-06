import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const purchases = (await query('SELECT * FROM purchases ORDER BY createdAt DESC')).rows;
    const purchaseItems = (await query('SELECT * FROM purchase_items')).rows;
    
    const purchasesWithItems = purchases.map(p => ({
      ...p,
      items: purchaseItems.filter(i => i.purchaseid === p.id)
    }));
    return NextResponse.json({ purchases: purchasesWithItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { supplierId, supplierName, date, total, paidAmount, items } = data;
    const id = 'INV-P' + Date.now();
    
    await query('INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount) VALUES (?,?,?,?,?,?)', [id, supplierId, supplierName, date, total || 0, paidAmount || 0]);
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]);
        await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, item.productId]);
      }
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, supplierId, supplierName, date, total, paidAmount } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await query('UPDATE purchases SET supplierId=?, supplierName=?, date=?, total=?, paidAmount=? WHERE id=?', [supplierId, supplierName, date, total, paidAmount, id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const items = (await query('SELECT * FROM purchase_items WHERE purchaseId=?', [id])).rows;
    for (const item of items) {
      await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, item.productid]);
    }
    await query('DELETE FROM purchase_items WHERE purchaseId=?', [id]);
    await query('DELETE FROM purchases WHERE id=?', [id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
