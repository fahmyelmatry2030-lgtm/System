import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applyCollectionEffects, reverseCollectionEffects, resolveInitialPostStatus } from '@/lib/posting';

export async function GET() {
  try {
    const collections = (await query('SELECT * FROM collections ORDER BY date DESC')).rows;
    return NextResponse.json({ collections });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const id = 'COL-' + Date.now();
    const postStatus = resolveInitialPostStatus(user);

    await query(
      `INSERT INTO collections (id, customerId, customerName, amount, date, method, notes, repId, repName, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.customerId, data.customerName, data.amount, data.date, data.method || 'cash', data.notes || '',
        data.repId || user?.id || null, data.repName || user?.fullName || null, postStatus,
        user?.id || null, user?.fullName || null,
        postStatus === 'posted' ? user?.id || null : null,
        postStatus === 'posted' ? user?.fullName || null : null,
        postStatus === 'posted' ? new Date().toISOString() : null,
      ]
    );

    if (postStatus === 'posted') {
      await applyCollectionEffects(id);
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

    const existing = (await query('SELECT * FROM collections WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'سند القبض غير موجود' }, { status: 404 });
    if (!canModifyRecord(existing, { role })) {
      return NextResponse.json({ error: 'لا يمكن حذف عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    if (isPosted(existing)) {
      await reverseCollectionEffects(id);
    }

    await query('DELETE FROM collections WHERE id = ?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
