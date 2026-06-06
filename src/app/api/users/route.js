import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
        // Exclude password from response
    const users = (await query('SELECT id, username, fullName, role, active, createdAt FROM users')).rows;
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
        const id = 'U' + Date.now();
    
    // Check if username exists
    const existing = (await query('SELECT id FROM users WHERE username = ?', [data.username])).rows[0];
    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم موجود مسبقاً' }, { status: 400 });
    }

    await query('INSERT INTO users (id, username, password, fullName, role, active) VALUES (?,?,?,?,?,?)', [id, data.username, data.password, data.fullName, data.role || 'rep', data.active === false ? 0 : 1]);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
        
    if (data.password) {
      await query('UPDATE users SET fullName = ?, role = ?, active = ?, password = ? WHERE id = ?', [data.fullName, data.role, data.active ? 1 : 0, data.password, data.id]);
    } else {
      await query('UPDATE users SET fullName = ?, role = ?, active = ? WHERE id = ?', [data.fullName, data.role, data.active ? 1 : 0, data.id]);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
