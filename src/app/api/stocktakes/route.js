import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const stocktakes = (await query('SELECT * FROM stocktakes ORDER BY date DESC')).rows;
    return NextResponse.json({ stocktakes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { date, productId, productName, systemQty, physicalQty, difference, status } = data;
    const id = 'STK-' + Date.now();
    
    await query('INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status) VALUES (?,?,?,?,?,?,?,?)', [id, date, productId, productName, systemQty, physicalQty, difference, status]);
    await query('UPDATE products SET qty = ? WHERE id = ?', [physicalQty, productId]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    await query('DELETE FROM stocktakes WHERE id=?', [id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
