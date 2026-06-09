import { query } from '@/lib/db';
import { NextResponse } from 'next/server';
import { getUserFromRequest, requireAdmin } from '@/lib/api-auth';

export async function POST(request) {
  try {
    const data = await request.json();
    const user = getUserFromRequest(data);
    requireAdmin(user);

    // حذف كل البيانات الوهمية ما عدا المستخدمين والإعدادات
    const tables = [
      'sales',
      'sale_items',
      'purchases',
      'purchase_items',
      'collections',
      'returns',
      'return_items',
      'expenses',
      'damaged',
      'stocktakes',
      'supplier_payments',
      'customers',
      'suppliers',
      'products'
    ];

    for (const table of tables) {
      try {
        await query(`DELETE FROM ${table}`);
      } catch (e) {
        // تجاهل الأخطاء إذا كانت الجداول فارغة
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'تم حذف جميع البيانات الوهمية بنجاح. النظام الآن جاهز للعمل من الصفر.'
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
