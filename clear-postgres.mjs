#!/usr/bin/env node

/**
 * Script لمسح جميع البيانات من PostgreSQL (Neon)
 * Clean all data from PostgreSQL
 */

import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '.env.local') });

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ خطأ: لم يتم العثور على DATABASE_URL أو POSTGRES_URL');
  process.exit(1);
}

console.log('🔗 الاتصال بـ PostgreSQL...\n');
const sql = neon(connectionString);

async function clearAllData() {
  console.log('📋 جاري التحقق من حالة قاعدة البيانات...\n');
  
  // الحصول على قائمة الجداول
  try {
    const tables = await sql(
      `SELECT table_name FROM information_schema.tables 
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`
    );
    
    console.log(`📊 الجداول الموجودة: ${tables.length}\n`);
    
    if (tables.length === 0) {
      console.log('✅ قاعدة البيانات فارغة بالفعل\n');
      return;
    }

    // عرض معلومات الجداول
    for (const table of tables) {
      const name = table.table_name;
      const countResult = await sql(`SELECT COUNT(*) as count FROM "${name}"`);
      const count = countResult[0].count;
      
      if (count > 0) {
        console.log(`📊 جدول "${name}": ${count} سجل`);
      } else {
        console.log(`⏭️  جدول "${name}": فارغ`);
      }
    }

    console.log('\n🧹 بدء مسح البيانات...\n');

    let totalRecords = 0;
    let deletedTables = 0;

    // مسح البيانات من جميع الجداول
    for (const table of tables) {
      const name = table.table_name;
      try {
        const countResult = await sql(`SELECT COUNT(*) as count FROM "${name}"`);
        const count = countResult[0].count;
        
        if (count > 0) {
          await sql(`DELETE FROM "${name}"`);
          console.log(`✅ تم حذف جدول "${name}": ${count} سجل`);
          totalRecords += count;
          deletedTables++;
        }
      } catch (error) {
        console.log(`⚠️  خطأ في مسح جدول "${name}": ${error.message}`);
      }
    }

    // مسح sequences
    console.log('\n🔄 مسح المسلسلات (Sequences)...\n');
    try {
      const sequences = await sql(
        `SELECT sequence_name FROM information_schema.sequences 
         WHERE sequence_schema = 'public'`
      );
      
      for (const seq of sequences) {
        try {
          await sql(`ALTER SEQUENCE "${seq.sequence_name}" RESTART WITH 1`);
          console.log(`✅ تم إعادة تعيين sequence: "${seq.sequence_name}"`);
        } catch (e) {}
      }
    } catch (e) {
      console.log('ℹ️  لا توجد sequences للمسح');
    }

    console.log(`\n✨ تم مسح البيانات بنجاح!`);
    console.log(`📊 إجمالي السجلات المحذوفة: ${totalRecords}`);
    console.log(`📋 عدد الجداول المنظفة: ${deletedTables}`);
    console.log('🚀 النظام الآن جاهز للعمل من الصفر\n');

  } catch (error) {
    console.error('\n❌ خطأ أثناء الاتصال:', error.message);
    process.exit(1);
  }
}

try {
  await clearAllData();
  process.exit(0);
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  process.exit(1);
}
