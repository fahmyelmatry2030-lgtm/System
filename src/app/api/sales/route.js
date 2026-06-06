import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const sales = (await query('SELECT * FROM sales ORDER BY createdAt DESC')).rows;
    const saleItems = (await query('SELECT * FROM sale_items')).rows;
    
    const salesWithItems = sales.map(s => ({
      ...s,
      items: saleItems.filter(i => i.saleid === s.id)
    }));
    return NextResponse.json({ sales: salesWithItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, items } = data;
    const id = 'INV-S' + Date.now();
    
    await query('INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)', [id, customerId, customerName, date, total || 0, paidAmount || 0, paymentStatus || 'unpaid', repId || null, repName || null]);
    
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]);
        await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, item.productId]);
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
    const { id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await query('UPDATE sales SET customerId=?, customerName=?, date=?, total=?, paidAmount=?, paymentStatus=?, repId=?, repName=? WHERE id=?', [customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const items = (await query('SELECT * FROM sale_items WHERE saleId=?', [id])).rows;
    for (const item of items) {
      await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, item.productid]);
    }
    await query('DELETE FROM sale_items WHERE saleId=?', [id]);
    await query('DELETE FROM sales WHERE id=?', [id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
