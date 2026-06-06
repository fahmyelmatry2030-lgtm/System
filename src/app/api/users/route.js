import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const db = getDb();
    // Exclude password from response
    const users = db.prepare('SELECT id, username, fullName, role, active, createdAt FROM users').all();
    return NextResponse.json({ users });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const db = getDb();
    const id = 'U' + Date.now();
    
    // Check if username exists
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(data.username);
    if (existing) {
      return NextResponse.json({ error: 'اسم المستخدم موجود مسبقاً' }, { status: 400 });
    }

    const stmt = db.prepare('INSERT INTO users (id, username, password, fullName, role, active) VALUES (?,?,?,?,?,?)');
    stmt.run(id, data.username, data.password, data.fullName, data.role || 'rep', data.active === false ? 0 : 1);
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const db = getDb();
    
    if (data.password) {
      const stmt = db.prepare('UPDATE users SET fullName = ?, role = ?, active = ?, password = ? WHERE id = ?');
      stmt.run(data.fullName, data.role, data.active ? 1 : 0, data.password, data.id);
    } else {
      const stmt = db.prepare('UPDATE users SET fullName = ?, role = ?, active = ? WHERE id = ?');
      stmt.run(data.fullName, data.role, data.active ? 1 : 0, data.id);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
