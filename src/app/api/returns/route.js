import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applyReturnEffects, reverseReturnEffects, resolveInitialPostStatus } from '@/lib/posting';

export async function GET() {
  try {
    const returns = (await query('SELECT * FROM returns ORDER BY date DESC')).rows;
    const returnItems = (await query('SELECT * FROM return_items')).rows;

    const returnsWithItems = returns.map((r) => ({
      ...r,
      items: returnItems.filter((i) => i.returnid === r.id || i.returnId === r.id),
    }));
    return NextResponse.json({ returns: returnsWithItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { type, entityId, entityName, date, reason, total, items } = data;
    const id = 'RET-' + Date.now();
    const postStatus = resolveInitialPostStatus(user);

    await query(
      `INSERT INTO returns (id, type, entityId, entityName, date, reason, total, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, type, entityId, entityName, date, reason || '', total || 0, postStatus,
        user?.id || null, user?.fullName || null,
        postStatus === 'posted' ? user?.id || null : null,
        postStatus === 'posted' ? user?.fullName || null : null,
        postStatus === 'posted' ? new Date().toISOString() : null,
      ]
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          'INSERT INTO return_items (returnId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)',
          [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]
        );
      }
    }

    if (postStatus === 'posted') {
      await applyReturnEffects(id);
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

    const existing = (await query('SELECT * FROM returns WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'المرتجع غير موجود' }, { status: 404 });
    if (!canModifyRecord(existing, { role })) {
      return NextResponse.json({ error: 'لا يمكن حذف عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    if (isPosted(existing)) {
      await reverseReturnEffects(id);
    }

    await query('DELETE FROM return_items WHERE returnId=?', [id]);
    await query('DELETE FROM returns WHERE id=?', [id]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
