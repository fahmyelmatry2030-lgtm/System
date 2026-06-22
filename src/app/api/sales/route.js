import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, canModifyRecord, isPosted } from '@/lib/api-auth';
import { applySaleEffects, reverseSaleEffects, resolveInitialPostStatus, unpostRecord } from '@/lib/posting';

function field(record, ...keys) {
  for (const key of keys) {
    if (record?.[key] !== undefined && record?.[key] !== null) return record[key];
  }
  return null;
}

export async function GET() {
  try {
    const sales = (await query('SELECT * FROM sales ORDER BY createdAt DESC')).rows;
    const saleItems = (await query('SELECT * FROM sale_items')).rows;

    const salesWithItems = sales.map((s) => ({
      ...s,
      items: saleItems.filter((i) => field(i, 'saleId', 'saleid') === s.id),
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
    
    // Get sequential invoice number
    const lastSale = (await query('SELECT id FROM sales ORDER BY id DESC LIMIT 1')).rows[0];
    let nextNumber = 1;
    if (lastSale && lastSale.id) {
      const match = lastSale.id.match(/INV-S(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
      }
    }
    const id = 'INV-S' + nextNumber;
    
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
        
        // ✅ خصم الكمية فقط إذا لم تكن مرحّلة (المندوب)
        // إذا كانت مرحّلة (المدير)، سيتم الخصم من قبل applySaleEffects
        if (postStatus !== 'posted') {
          await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, item.productId]);
        }
      }
    }

    // للمبيعات المرحّلة، تطبيق التأثيرات (خصم المخزون بشكل صحيح)
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
    } else {
      // Reverse inventory changes for non-posted sales
      const oldItems = (await query('SELECT * FROM sale_items WHERE saleId = ?', [id])).rows;
      for (const item of oldItems) {
        const productId = field(item, 'productId', 'productid');
        await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, productId]);
      }
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
        
        // ✅ خصم الكمية فقط للمبيعات غير المرحّلة
        // إذا كانت مرحّلة، سيتم الخصم من قبل applySaleEffects
        if (!wasPosted) {
          await query('UPDATE products SET qty = qty - ? WHERE id = ?', [item.qty, item.productId]);
        }
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
    } else {
      // Restore inventory for non-posted sales
      const items = (await query('SELECT * FROM sale_items WHERE saleId = ?', [id])).rows;
      for (const item of items) {
        const productId = field(item, 'productId', 'productid');
        await query('UPDATE products SET qty = qty + ? WHERE id = ?', [item.qty, productId]);
      }
    }

    await query('DELETE FROM sale_items WHERE saleId=?', [id]);
    await query('DELETE FROM sales WHERE id=?', [id]);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ✅ NEW: Cancel posting (Unpost)
export async function PATCH(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    const { id, action } = data;
    
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'فقط المدير يمكنه ترحيل أو إلغاء ترحيل الفواتير' }, { status: 403 });
    }

    const existing = (await query('SELECT * FROM sales WHERE id = ?', [id])).rows[0];
    if (!existing) return NextResponse.json({ error: 'الفاتورة غير موجودة' }, { status: 404 });

    // If no action specified, default to 'post'
    if (!action || action === 'post') {
      // POST: Move from pending to posted
      if (existing.postStatus === 'posted') {
        return NextResponse.json({ error: 'الفاتورة مرحلة بالفعل' }, { status: 400 });
      }
      
      // Apply effects (deduct inventory, update customer balance)
      await applySaleEffects(id);
      
      // Update to posted
      await query(
        'UPDATE sales SET postStatus = ?, postedBy = ?, postedByName = ?, postedAt = ? WHERE id = ?',
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
          'sales',
          id,
          user?.id || null,
          user?.fullName || null,
          `تم ترحيل فاتورة البيع ${id}`,
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
      
      // Reverse effects (restore inventory, update customer balance)
      await reverseSaleEffects(id);
      
      // Update to pending
      await query(
        'UPDATE sales SET postStatus = ?, postedBy = NULL, postedByName = NULL, postedAt = NULL WHERE id = ?',
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
          'sales',
          id,
          user?.id || null,
          user?.fullName || null,
          `تم إلغاء ترحيل فاتورة البيع ${id}`,
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
