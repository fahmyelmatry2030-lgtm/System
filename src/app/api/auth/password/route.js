import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, currentPassword, newPassword } = await request.json();
    
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ error: 'جميع الحقول مطلوبة' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل' }, { status: 400 });
    }

    // Verify current password
    const user = (await query('SELECT * FROM users WHERE id = ? AND password = ?', [userId, currentPassword])).rows[0];
    
    if (!user) {
      return NextResponse.json({ error: 'كلمة المرور الحالية غير صحيحة' }, { status: 401 });
    }

    // Update password
    await query('UPDATE users SET password = ? WHERE id = ?', [newPassword, userId]);

    return NextResponse.json({ success: true, message: 'تم تغيير كلمة المرور بنجاح' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
