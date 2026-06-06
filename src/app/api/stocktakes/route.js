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
    const { date, productId, productName, systemQty, physicalQty, difference, status } = data;
    const id = 'STK-' + Date.now();
    
    const insertStocktake = db.prepare('INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status) VALUES (?,?,?,?,?,?,?,?)');
    const updateProduct = db.prepare('UPDATE products SET qty = ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      insertStocktake.run(id, date, productId, productName, systemQty, physicalQty, difference, status);
      // Adjust system quantity to physical quantity
      updateProduct.run(physicalQty, productId);
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
    const db = getDb();
    
    // We optionally could revert the stocktake but usually stocktakes are final unless explicitly undone.
    // We will just delete the record here without reverting, as the "current" physical qty is what matters.
    db.prepare('DELETE FROM stocktakes WHERE id=?').run(id);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
