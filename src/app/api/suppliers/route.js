import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const suppliers = (await query('SELECT * FROM suppliers ORDER BY createdAt DESC')).rows;
    return NextResponse.json({ suppliers });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const id = 'S' + Date.now();
    
    await query('INSERT INTO suppliers (id, name, phone, balance) VALUES (?,?,?,?)', [id, data.name, data.phone || null, data.balance || 0]);
    
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

    await query('UPDATE suppliers SET name=?, phone=?, balance=? WHERE id=?', [name, phone || null, balance || 0, id]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    await query('DELETE FROM suppliers WHERE id=?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
