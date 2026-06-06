import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const customers = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
    return NextResponse.json({ customers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const id = 'C' + Date.now();
    
    const stmt = db.prepare('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)');
    stmt.run(id, data.name, data.phone || null, data.balance || 0);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const { id, name, phone, balance } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const stmt = db.prepare('UPDATE customers SET name=?, phone=?, balance=? WHERE id=?');
    stmt.run(name, phone || null, balance || 0, id);
    
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
    db.prepare('DELETE FROM customers WHERE id=?').run(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
