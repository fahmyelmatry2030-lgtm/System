import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { resolveInitialPostStatus } from '@/lib/posting';

export async function GET() {
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
    const user = getUserFromRequest(data);
    const id = 'EXP-' + Date.now();
    const postStatus = resolveInitialPostStatus(user);

    await query(
      `INSERT INTO expenses (id, category, date, amount, description, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.category, data.date, data.amount, data.description || '', postStatus,
        user?.id || null, user?.fullName || null,
        postStatus === 'posted' ? user?.id || null : null,
        postStatus === 'posted' ? user?.fullName || null : null,
        postStatus === 'posted' ? new Date().toISOString() : null,
      ]
    );

    return NextResponse.json({ success: true, id, postStatus });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const role = request.nextUrl.searchParams.get('role');

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = (await query('SELECT * FROM expenses WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'المصروف غير موجود' }, { status: 404 });
    if (!canModifyRecord(existing, { role })) {
      return NextResponse.json({ error: 'لا يمكن حذف عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    await query('DELETE FROM expenses WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
