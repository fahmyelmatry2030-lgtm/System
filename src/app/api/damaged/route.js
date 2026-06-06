import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const damaged = db.prepare('SELECT * FROM damaged ORDER BY date DESC').all();
    return NextResponse.json({ damaged });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const { productId, productName, qty, date, reason, type, value } = data;
    const id = 'DMG-' + Date.now();
    
    const insertDamaged = db.prepare('INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value) VALUES (?,?,?,?,?,?,?,?)');
    const updateProduct = db.prepare('UPDATE products SET qty = qty - ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      insertDamaged.run(id, productId, productName, qty, date, reason || '', type || 'damaged', value || 0);
      updateProduct.run(qty, productId);
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
    
    const damagedItem = db.prepare('SELECT * FROM damaged WHERE id=?').get(id);
    const deleteDamaged = db.prepare('DELETE FROM damaged WHERE id=?');
    const updateProduct = db.prepare('UPDATE products SET qty = qty + ? WHERE id = ?');
    
    const transaction = db.transaction(() => {
      if (damagedItem) {
        updateProduct.run(damagedItem.qty, damagedItem.productId);
        deleteDamaged.run(id);
      }
    });
    transaction();
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
