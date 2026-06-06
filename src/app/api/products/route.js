import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const products = (await query('SELECT * FROM products ORDER BY createdAt DESC')).rows;
    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const id = 'P' + Date.now();
    
    await query('INSERT INTO products (id, name, sku, category, qty, purchasePrice, sellPrice, expiryDate, threshold) VALUES (?,?,?,?,?,?,?,?,?)', [id, data.name, data.sku || null, data.category || null, data.qty || 0, data.purchasePrice || 0, data.sellPrice || 0, data.expiryDate || null, data.threshold || 5]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const { id, name, sku, category, qty, purchasePrice, sellPrice, expiryDate, threshold } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await query('UPDATE products SET name=?, sku=?, category=?, qty=?, purchasePrice=?, sellPrice=?, expiryDate=?, threshold=? WHERE id=?', [name, sku || null, category || null, qty || 0, purchasePrice || 0, sellPrice || 0, expiryDate || null, threshold || 5, id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    await query('DELETE FROM products WHERE id=?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
