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
    const id = 'STK-' + Date.now();
    
    await query('INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status, notes) VALUES (?,?,?,?,?,?,?,?,?)', [id, data.date, data.productId, data.productName, data.systemQty, data.physicalQty, data.difference, data.status, data.notes || '']);
    
    if (data.adjustInventory && data.difference !== 0) {
      await query('UPDATE products SET qty = ? WHERE id = ?', [data.physicalQty, data.productId]);
    }
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
