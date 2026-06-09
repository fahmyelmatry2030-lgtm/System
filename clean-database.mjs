#!/usr/bin/env node

/**
 * Script متقدم لمسح البيانات والتحقق من حالة قاعدة البيانات
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
      if (sqlString.trim().split(/\s+/)[0].toUpperCase() === 'SELECT') {
        const stmt = sqliteDb.prepare(sqlString);
        if (params && params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
          rows.push(stmt.getAsObject());
        }
        stmt.free();
        resolve({ rows, rowCount: rows.length });
      } else {
        const stmt = sqliteDb.prepare(sqlString);
        if (params && params.length) stmt.bind(params);
        stmt.step();
        stmt.free();
        
        try {
          const data = sqliteDb.export();
          fs.writeFileSync(sqlitePath, Buffer.from(data));
        } catch (err) {}
        
        resolve({ rows: [], rowCount: 1 });
      }
    } catch (error) {
      reject(error);
    }
  });
}

async function getExistingTables() {
  try {
    if (usePostgres) {
      const result = await executeQuery(
        `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
      );
      return result.rows.map(r => r.table_name);
    } else {
      const result = await executeQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`
      );
      return result.rows.map(r => r.name);
    }
  } catch (error) {
    console.error('❌ خطأ في الاستعلام عن الجداول:', error.message);
    return [];
  }
}

async function getRecordCount(table) {
  try {
    const result = await executeQuery(`SELECT COUNT(*) as count FROM ${table}`);
    return result.rows[0]?.count || 0;
  } catch {
    return 0;
  }
}

async function clearAllData() {
  console.log('\n📋 جاري التحقق من حالة قاعدة البيانات...\n');
  
  const existingTables = await getExistingTables();
  
  if (existingTables.length === 0) {
    console.log('✅ قاعدة البيانات فارغة أو لم يتم إنشاؤها بعد\n');
    return;
  }

  console.log(`📊 الجداول الموجودة: ${existingTables.join(', ')}\n`);
  console.log('🧹 بدء مسح البيانات...\n');

  const dataTables = [
    'sales', 'sale_items', 'purchases', 'purchase_items',
    'collections', 'returns', 'return_items', 'expenses',
    'damaged', 'stocktakes', 'supplier_payments',
    'customers', 'suppliers', 'products', 'audit_logs'
  ];

  let totalRecords = 0;
  let deletedTables = 0;

  for (const table of dataTables) {
    if (existingTables.includes(table)) {
      try {
        const count = await getRecordCount(table);
        if (count > 0) {
          console.log(`📊 جدول ${table}: ${count} سجل`);
          await executeQuery(`DELETE FROM ${table}`);
          console.log(`✅ تم حذف جدول: ${table}`);
          totalRecords += count;
          deletedTables++;
        } else {
          console.log(`⏭️  جدول ${table}: فارغ بالفعل`);
        }
      } catch (error) {
        console.log(`⚠️  خطأ في مسح ${table}: ${error.message}`);
      }
    }
  }

  console.log(`\n✨ تم مسح البيانات بنجاح!`);
  console.log(`📊 إجمالي السجلات المحذوفة: ${totalRecords}`);
  console.log(`📋 عدد الجداول المنظفة: ${deletedTables}`);
  console.log('🚀 النظام الآن جاهز للعمل من الصفر\n');
}

try {
  await clearAllData();
  process.exit(0);
} catch (error) {
  console.error('\n❌ خطأ:', error.message);
  process.exit(1);
}
