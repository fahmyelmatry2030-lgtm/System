import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAdmin } from '@/lib/api-auth';
import { postRecord } from '@/lib/posting';

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    requireAdmin(user);

    const { entity, id } = data;
    if (!entity || !id) {
      return NextResponse.json({ error: 'بيانات الترحيل غير مكتملة' }, { status: 400 });
    }

    await postRecord(entity, id, user);
    return NextResponse.json({ success: true, message: 'تم الترحيل بنجاح' });
  } catch (error) {
    const status = error.message === 'هذه العملية متاحة للمدير فقط' ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }
}
