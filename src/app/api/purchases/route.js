import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applyPurchaseEffects, reversePurchaseEffects } from '@/lib/posting';

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

// ✅ NEW: Post/Unpost purchases (similar to sales)
export async function PATCH(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { id, action } = data;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'فقط المدير يمكنه ترحيل أو إلغاء ترحيل الفواتير' }, { status: 403 });
    }

    const existing = (await query('SELECT * FROM purchases WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

    // If no action specified, default to 'post'
    if (!action || action === 'post') {
      // POST: Move from pending to posted
      if (existing.postStatus === 'posted') {
        return NextResponse.json({ error: 'الفاتورة مرحلة بالفعل' }, { status: 400 });
      }
      
      // Apply effects (add inventory, update supplier balance)
      await applyPurchaseEffects(id);
      
      // Update to posted
      await query(
        'UPDATE purchases SET postStatus = ?, postedBy = ?, postedByName = ?, postedAt = ? WHERE id = ?',
        ['posted', user?.id || null, user?.fullName || null, new Date().toISOString(), id]
      );
      
      // Log to audit trail
      const auditId = 'LOG-' + Date.now();
      await query(
        `INSERT INTO audit_logs (id, action, entity, recordId, userId, userName, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          'ترحيل',
          'purchases',
          id,
          user?.id || null,
          user?.fullName || null,
          `تم ترحيل فاتورة الشراء ${id}`,
          new Date().toISOString()
        ]
      );
      
      return NextResponse.json({ success: true, id, message: 'تم ترحيل الفاتورة بنجاح' });
    } 
    else if (action === 'unpost') {
      // UNPOST: Move from posted to pending
      if (existing.postStatus !== 'posted') {
        return NextResponse.json({ error: 'الفاتورة غير مرحلة' }, { status: 400 });
      }
      
      // Reverse effects (restore inventory, update supplier balance)
      await reversePurchaseEffects(id);
      
      // Update to pending
      await query(
        'UPDATE purchases SET postStatus = ?, postedBy = NULL, postedByName = NULL, postedAt = NULL WHERE id = ?',
        ['pending', id]
      );
      
      // Log to audit trail
      const auditId = 'LOG-' + Date.now();
      await query(
        `INSERT INTO audit_logs (id, action, entity, recordId, userId, userName, details, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          auditId,
          'إلغاء ترحيل',
          'purchases',
          id,
          user?.id || null,
          user?.fullName || null,
          `تم إلغاء ترحيل فاتورة الشراء ${id}`,
          new Date().toISOString()
        ]
      );
      
      return NextResponse.json({ success: true, id, message: 'تم إلغاء الترحيل بنجاح' });
    }
    
    return NextResponse.json({ error: 'إجراء غير معروف' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
