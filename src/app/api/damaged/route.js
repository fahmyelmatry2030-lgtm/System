import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applyDamagedEffects, reverseDamagedEffects, resolveInitialPostStatus } from '@/lib/posting';

export async function GET() {
  try {
    const damaged = (await query('SELECT * FROM damaged ORDER BY date DESC')).rows;
    return NextResponse.json({ damaged });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { productId, productName, qty, date, reason, type, value } = data;
    const id = 'DMG-' + Date.now();
    const postStatus = resolveInitialPostStatus(user);

    await query(
      `INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, productId, productName, qty, date, reason || '', type || 'تالف', value || 0, postStatus,
        user?.id || null, user?.fullName || null,
        postStatus === 'posted' ? user?.id || null : null,
        postStatus === 'posted' ? user?.fullName || null : null,
        postStatus === 'posted' ? new Date().toISOString() : null,
      ]
    );

    if (postStatus === 'posted') {
      await applyDamagedEffects(id);
    }

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

    const existing = (await query('SELECT * FROM damaged WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'السجل غير موجود' }, { status: 404 });
    if (!canModifyRecord(existing, { role })) {
      return NextResponse.json({ error: 'لا يمكن حذف عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    if (isPosted(existing)) {
      await reverseDamagedEffects(id);
    }

    await query('DELETE FROM damaged WHERE id=?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
