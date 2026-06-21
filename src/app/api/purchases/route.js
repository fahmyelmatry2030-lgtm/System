import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';

function field(record, ...keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
  }
  return null;
}

export async function GET() {
  try {
    const purchases = (await query('SELECT * FROM purchases ORDER BY createdAt DESC')).rows;
    const purchaseItems = (await query('SELECT * FROM purchase_items')).rows;

    const purchasesWithItems = purchases.map((p) => ({
      ...p,
      items: purchaseItems.filter((i) => i.purchaseId === p.id || i.purchaseid === p.id),
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
    const { supplierId, suppliername, date, total, paidAmount, notes, items } = data;
    
    // Get sequential invoice number
    const lastPurchase = (await query('SELECT id FROM purchases ORDER BY id DESC LIMIT 1')).rows[0];
    let nextNumber = 1;
    if (lastPurchase && lastPurchase.id) {
      const match = lastPurchase.id.match(/PO-(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const id = 'PO-' + nextNumber;

    await query(
      `INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount, notes, postStatus, createdBy, createdByName, postedBy, postedByName, postedAt)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, supplierId, suppliername, date, total || 0, paidAmount || 0, notes || '',
        'pending', user?.id || null, user?.fullName || null, null, null, null,
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

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { id, supplierId, suppliername, date, total, paidAmount, notes, items } = data;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = (await query('SELECT * FROM purchases WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

    await query(
      'UPDATE purchases SET supplierId=?, supplierName=?, date=?, total=?, paidAmount=?, notes=? WHERE id=?',
      [supplierId, suppliername, date, total, paidAmount, notes || '', id]
    );

    if (items && Array.isArray(items)) {
      await query('DELETE FROM purchase_items WHERE purchaseId=?', [id]);
      for (const item of items) {
        await query(
          'INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)',
          [id, item.productId, item.productName, item.qty, item.price, item.qty * item.price]
        );
      }
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

    const existing = (await query('SELECT * FROM purchases WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

    await query('DELETE FROM purchase_items WHERE purchaseId=?', [id]);
    await query('DELETE FROM purchases WHERE id=?', [id]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
