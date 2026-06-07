import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applyPurchaseEffects, reversePurchaseEffects, resolveInitialPostStatus } from '@/lib/posting';

export async function GET() {
  try {
    const purchases = (await query('SELECT * FROM purchases ORDER BY createdAt DESC')).rows;
    const purchaseItems = (await query('SELECT * FROM purchase_items')).rows;

    const purchasesWithItems = purchases.map((p) => ({
      ...p,
      items: purchaseItems.filter((i) => i.purchaseid === p.id || i.purchaseId === p.id),
    }));
    return NextResponse.json({ purchases: purchasesWithItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { supplierId, supplierName, date, total, paidAmount, items } = data;
    const id = 'INV-P' + Date.now();
    const postStatus = resolveInitialPostStatus(user);

    await query(
      `INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, supplierId, supplierName, date, total || 0, paidAmount || 0, postStatus,
        user?.id || null, user?.fullName || null,
        postStatus === 'posted' ? user?.id || null : null,
        postStatus === 'posted' ? user?.fullName || null : null,
        postStatus === 'posted' ? new Date().toISOString() : null,
      ]
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          'INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)',
          [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]
        );
      }
    }

    if (postStatus === 'posted') {
      await applyPurchaseEffects(id);
    }

    return NextResponse.json({ success: true, id, postStatus });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { id, supplierId, supplierName, date, total, paidAmount } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = (await query('SELECT * FROM purchases WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    if (!canModifyRecord(existing, user)) {
      return NextResponse.json({ error: 'لا يمكن تعديل عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    await query(
      'UPDATE purchases SET supplierId=?, supplierName=?, date=?, total=?, paidAmount=? WHERE id=?',
      [supplierId, supplierName, date, total, paidAmount, id]
    );

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    const role = request.nextUrl.searchParams.get('role');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = (await query('SELECT * FROM purchases WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    if (!canModifyRecord(existing, { role })) {
      return NextResponse.json({ error: 'لا يمكن حذف عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    if (isPosted(existing)) {
      await reversePurchaseEffects(id);
    }

    await query('DELETE FROM purchase_items WHERE purchaseId=?', [id]);
    await query('DELETE FROM purchases WHERE id=?', [id]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
