import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const damaged = (await query('SELECT * FROM damaged ORDER BY date DESC')).rows;
    return NextResponse.json({ damaged });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { productId, productName, qty, date, reason, type, value } = data;
    const id = 'DMG-' + Date.now();
    
    await query('INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value) VALUES (?,?,?,?,?,?,?,?)', [id, productId, productName, qty, date, reason || '', type || 'damaged', value || 0]);
    await query('UPDATE products SET qty = qty - ? WHERE id = ?', [qty, productId]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const damagedItem = (await query('SELECT * FROM damaged WHERE id=?', [id])).rows[0];
    if (damagedItem) {
      await query('UPDATE products SET qty = qty + ? WHERE id = ?', [damagedItem.qty, damagedItem.productid]);
      await query('DELETE FROM damaged WHERE id=?', [id]);
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
