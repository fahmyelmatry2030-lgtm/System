import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const products = db.prepare('SELECT * FROM products ORDER BY createdAt DESC').all();
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const id = 'P' + Date.now();
    
    const stmt = db.prepare('INSERT INTO products (id, name, sku, category, qty, purchasePrice, sellPrice, expiryDate, threshold) VALUES (?,?,?,?,?,?,?,?,?)');
    stmt.run(id, data.name, data.sku || null, data.category || null, data.qty || 0, data.purchasePrice || 0, data.sellPrice || 0, data.expiryDate || null, data.threshold || 5);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const { id, name, sku, category, qty, purchasePrice, sellPrice, expiryDate, threshold } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const stmt = db.prepare('UPDATE products SET name=?, sku=?, category=?, qty=?, purchasePrice=?, sellPrice=?, expiryDate=?, threshold=? WHERE id=?');
    stmt.run(name, sku || null, category || null, qty || 0, purchasePrice || 0, sellPrice || 0, expiryDate || null, threshold || 5, id);
    
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
    db.prepare('DELETE FROM products WHERE id=?').run(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
