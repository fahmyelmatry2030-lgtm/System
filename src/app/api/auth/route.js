import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' }, { status: 400 });
    }

    const result = await query('SELECT id, username, fullName, role FROM users WHERE username = ? AND password = ? AND active = 1', [username, password]);
    const row = result.rows[0];

    if (!row) {
      return NextResponse.json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة' }, { status: 401 });
    }

    const user = {
      id: row.id,
      username: row.username,
      fullName: row.fullname || row.fullName,
      role: row.role,
    };

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'حدث خطأ في الخادم' }, { status: 500 });
  }
}
