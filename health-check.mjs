#!/usr/bin/env node

/**
 * Script للتحقق من حالة النظام بعد التنظيف
 * System Health Check Script
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.local') });

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
const sql = neon(connectionString);

async function checkSystemHealth() {
  console.log('\n🏥 فحص صحة النظام...\n');
  
  try {
    // 1. التحقق من الاتصال
    console.log('✅ اختبار الاتصال بقاعدة البيانات...');
    const connection = await sql('SELECT 1');
    console.log('✅ الاتصال يعمل بنجاح\n');

    // 2. عرض معلومات الجداول
    console.log('📋 معلومات الجداول:\n');
    
    const tables = [
      'users', 'products', 'suppliers', 'customers',
      'sales', 'sale_items', 'purchases', 'purchase_items',
      'collections', 'returns', 'return_items', 'expenses',
      'damaged', 'stocktakes', 'supplier_payments'
    ];

    let totalRecords = 0;
    let emptyTables = 0;
    let tables_with_data = 0;

    for (const table of tables) {
      try {
        const result = await sql(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = parseInt(result[0].count, 10) || 0;
        totalRecords += count;
        
        if (count === 0) {
          console.log(`  ✅ جدول "${table}": فارغ (جاهز)`);
          emptyTables++;
        } else {
          console.log(`  ⚠️  جدول "${table}": يحتوي على ${count} سجل`);
          tables_with_data++;
        }
      } catch (e) {
        console.log(`  ❌ خطأ في جدول "${table}": ${e.message}`);
      }
    }

    console.log(`\n📊 ملخص الحالة:`);
    console.log(`   - إجمالي السجلات: ${totalRecords}`);
    console.log(`   - الجداول الفارغة: ${emptyTables}`);
    console.log(`   - الجداول بها بيانات: ${tables_with_data}`);

    // 3. عرض الإجراءات المقترحة
    console.log('\n💡 الخطوات التالية:');
    if (tables_with_data === 0) {
      console.log('   ✅ النظام نظيف وجاهز للعمل!');
      console.log('   1. ابدأ بإنشاء الموردين (Suppliers)');
      console.log('   2. ثم أضف المنتجات (Products)');
      console.log('   3. بعدها أضف العملاء (Customers)');
      console.log('   4. ثم ابدأ العمليات (مبيعات، مشتريات، إلخ)');
    } else {
      console.log('   ⚠️  يوجد بيانات بحاجة إلى تنظيف إضافي');
    }

    console.log('\n🚀 النظام جاهز للعمل!\n');

  } catch (error) {
    console.error('\n❌ خطأ في فحص النظام:', error.message);
    process.exit(1);
  }
}

try {
  await checkSystemHealth();
  process.exit(0);
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  process.exit(1);
}
