import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applyStocktakeEffects, reverseStocktakeEffects, resolveInitialPostStatus } from '@/lib/posting';

export async function GET() {
  try {
    const stocktakes = (await query('SELECT * FROM stocktakes ORDER BY date DESC')).rows;
    return NextResponse.json({ stocktakes });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const id = 'STK-' + Date.now();
    const postStatus = resolveInitialPostStatus(user);

    await query(
      `INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status, notes, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, data.date, data.productId, data.productName, data.systemQty, data.physicalQty,
        data.difference, data.status, data.notes || '', postStatus,
        user?.id || null, user?.fullName || null,
        postStatus === 'posted' ? user?.id || null : null,
        postStatus === 'posted' ? user?.fullName || null : null,
        postStatus === 'posted' ? new Date().toISOString() : null,
      ]
    );

    if (postStatus === 'posted' && data.difference !== 0) {
      await applyStocktakeEffects(id);
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

    const existing = (await query('SELECT * FROM stocktakes WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'سجل الجرد غير موجود' }, { status: 404 });
    if (!canModifyRecord(existing, { role })) {
      return NextResponse.json({ error: 'لا يمكن حذف عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    if (isPosted(existing)) {
      await reverseStocktakeEffects(id);
    }

    await query('DELETE FROM stocktakes WHERE id = ?', [id]);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
