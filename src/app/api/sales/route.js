import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applySaleEffects, reverseSaleEffects, resolveInitialPostStatus } from '@/lib/posting';

export async function GET() {
  try {
    const sales = (await query('SELECT * FROM sales ORDER BY createdAt DESC')).rows;
    const saleItems = (await query('SELECT * FROM sale_items')).rows;

    const salesWithItems = sales.map((s) => ({
      ...s,
      items: saleItems.filter((i) => i.saleid === s.id || i.saleId === s.id),
    }));
    return NextResponse.json({ sales: salesWithItems });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, items } = data;
    const id = 'INV-S' + Date.now();
    const postStatus = resolveInitialPostStatus(user);

    await query(
      `INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, customerId, customerName, date, total || 0, paidAmount || 0, paymentStatus || 'unpaid',
        repId || user?.id || null, repName || user?.fullName || null, postStatus,
        user?.id || null, user?.fullName || null,
        postStatus === 'posted' ? user?.id || null : null,
        postStatus === 'posted' ? user?.fullName || null : null,
        postStatus === 'posted' ? new Date().toISOString() : null,
      ]
    );

    if (items && Array.isArray(items)) {
      for (const item of items) {
        await query(
          'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)',
          [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]
        );
      }
    }

    if (postStatus === 'posted') {
      await applySaleEffects(id);
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
    const { id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, items } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = (await query('SELECT * FROM sales WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    if (!canModifyRecord(existing, user)) {
      return NextResponse.json({ error: 'لا يمكن تعديل عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    const wasPosted = isPosted(existing);
    if (wasPosted) {
      await reverseSaleEffects(id);
    }

    await query(
      'UPDATE sales SET customerId=?, customerName=?, date=?, total=?, paidAmount=?, paymentStatus=?, repId=?, repName=? WHERE id=?',
      [customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, id]
    );

    if (items && Array.isArray(items)) {
      await query('DELETE FROM sale_items WHERE saleId=?', [id]);
      for (const item of items) {
        await query(
          'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)',
          [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]
        );
      }
    }

    if (wasPosted) {
      await applySaleEffects(id);
    }

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

    const existing = (await query('SELECT * FROM sales WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });
    if (!canModifyRecord(existing, { role })) {
      return NextResponse.json({ error: 'لا يمكن حذف عملية مرحّلة إلا من قبل المدير' }, { status: 403 });
    }

    if (isPosted(existing)) {
      await reverseSaleEffects(id);
    }

    await query('DELETE FROM sale_items WHERE saleId=?', [id]);
    await query('DELETE FROM sales WHERE id=?', [id]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
