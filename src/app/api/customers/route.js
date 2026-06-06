import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
        const customers = (await query('SELECT * FROM customers ORDER BY createdAt DESC')).rows;
    return NextResponse.json({ customers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
        const id = 'C' + Date.now();
    
    const stmt = await query('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)');
    stmt.run(id, data.name, data.phone || null, data.balance || 0);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
        const { id, name, phone, balance } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    await query('UPDATE customers SET name=?, phone=?, balance=? WHERE id=?', [name, phone || null, balance || 0, id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        db.prepare('DELETE FROM customers WHERE id=?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
