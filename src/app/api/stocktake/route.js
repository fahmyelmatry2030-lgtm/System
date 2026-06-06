import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const stocktakes = db.prepare('SELECT * FROM stocktakes ORDER BY date DESC').all();
    return NextResponse.json({ stocktakes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const id = 'STK-' + Date.now();
    
    // Start transaction to record stocktake and adjust inventory if needed
    const transaction = db.transaction(() => {
      // Add stocktake record
      const stmt = db.prepare('INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status, notes) VALUES (?,?,?,?,?,?,?,?,?)');
      stmt.run(id, data.date, data.productId, data.productName, data.systemQty, data.physicalQty, data.difference, data.status, data.notes || '');
      
      // If there's a difference and user chose to adjust
      if (data.adjustInventory && data.difference !== 0) {
        const updateProduct = db.prepare('UPDATE products SET qty = ? WHERE id = ?');
        updateProduct.run(data.physicalQty, data.productId);
      }
    });
    
    transaction();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
