import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY createdAt DESC').all();
    return NextResponse.json({ suppliers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const id = 'S' + Date.now();
    
    const stmt = db.prepare('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)');
    stmt.run(id, data.name, data.phone || null, data.email || null, data.balance || 0);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const { id, name, phone, email, balance } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const stmt = db.prepare('UPDATE suppliers SET name=?, phone=?, email=?, balance=? WHERE id=?');
    stmt.run(name, phone || null, email || null, balance || 0, id);
    
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
    db.prepare('DELETE FROM suppliers WHERE id=?').run(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
