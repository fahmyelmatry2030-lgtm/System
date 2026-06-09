#!/usr/bin/env node

/**
 * Script لمسح جميع البيانات الوهمية من النظام
 * Clears all dummy data from the system
 */

import { neon } from '@neondatabase/serverless';
import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
const usePostgres = !!connectionString;

let pool = null;
let sqliteDb = null;
let SQL = null;
let sqlitePath = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (usePostgres) {
  console.log('🔗 استخدام PostgreSQL...');
  pool = neon(connectionString);
} else {
  console.log('🔗 استخدام SQLite...');
  sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, 'database.sqlite');
}

async function executeQuery(sqlString, params = []) {
  if (usePostgres) {
    let i = 1;
    const pgSql = sqlString.replace(/\?/g, () => `$${i++}`);
    try {
      const result = await pool(pgSql, params);
      return { rows: result, rowCount: result.length };
    } catch (error) {
      console.error('خطأ في PostgreSQL:', error.message);
      throw error;
    }
  }
  
  // SQLite
  if (!SQL) {
    const initSql = await initSqlJs({ 
      locateFile: (file) => fileURLToPath(new URL(`./node_modules/sql.js/dist/${file}`, import.meta.url)) 
    });
    SQL = initSql;
  }
  if (!sqliteDb) {
    if (fs.existsSync(sqlitePath)) {
      const buffer = fs.readFileSync(sqlitePath);
      sqliteDb = new SQL.Database(new Uint8Array(buffer));
    } else {
      sqliteDb = new SQL.Database();
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const stmt = sqliteDb.prepare(sqlString);
      if (params && params.length) stmt.bind(params);
      stmt.step();
      stmt.free();
      
      // حفظ قاعدة البيانات
      try {
        const data = sqliteDb.export();
        fs.writeFileSync(sqlitePath, Buffer.from(data));
      } catch (err) {
        console.error('خطأ في حفظ SQLite:', err.message);
      }
      resolve({ rows: [], rowCount: 1 });
    } catch (error) {
      reject(error);
    }
  });
}

async function clearAllData() {
  console.log('\n🧹 بدء مسح البيانات الوهمية...\n');
  
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
    'products',
    'audit_logs'
  ];

  let deletedCount = 0;

  for (const table of tables) {
    try {
      const result = await executeQuery(`DELETE FROM ${table}`);
      console.log(`✅ تم حذف جدول: ${table}`);
      deletedCount++;
    } catch (error) {
      // تجاهل الأخطاء إذا كانت الجداول غير موجودة أو فارغة
      console.log(`⏭️  جدول ${table} فارغ أو غير موجود`);
    }
  }

  console.log(`\n✨ تم مسح البيانات بنجاح!`);
  console.log(`📊 عدد الجداول المنظفة: ${deletedCount}`);
  console.log('🚀 النظام الآن جاهز للعمل من الصفر\n');
  
  process.exit(0);
}

// تشغيل Script
try {
  await clearAllData();
} catch (error) {
  console.error('\n❌ خطأ أثناء مسح البيانات:', error.message);
  process.exit(1);
}
