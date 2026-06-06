import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
        const expenses = (await query('SELECT * FROM expenses ORDER BY date DESC')).rows;
    return NextResponse.json({ expenses });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
        const id = 'EXP-' + Date.now();
    
    const stmt = await query('INSERT INTO expenses (id, category, date, amount, description) VALUES (?,?,?,?,?)');
    stmt.run(id, data.category, data.date, data.amount, data.description || '');
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
        db.prepare('DELETE FROM expenses WHERE id = ?', [id]);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
