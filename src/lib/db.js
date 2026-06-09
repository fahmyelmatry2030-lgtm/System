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
let dbReady = false;
let dbInitPromise = null;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
if (usePostgres) {
  pool = neon(connectionString);
} else {
  sqlitePath = process.env.SQLITE_PATH || path.join(__dirname, '../../database.sqlite');
}

const POSTING_TABLES = ['sales', 'purchases', 'returns', 'collections', 'expenses', 'damaged', 'stocktakes'];

const POSTING_COLUMN_DEFS = [
  { name: 'postStatus', sqlite: "TEXT DEFAULT 'pending'", pg: "TEXT DEFAULT 'pending'" },
  { name: 'postedBy', sqlite: 'TEXT', pg: 'TEXT' },
  { name: 'postedByName', sqlite: 'TEXT', pg: 'TEXT' },
  { name: 'postedAt', sqlite: 'TEXT', pg: 'TEXT' },
  { name: 'createdBy', sqlite: 'TEXT', pg: 'TEXT' },
  { name: 'createdByName', sqlite: 'TEXT', pg: 'TEXT' },
];

function toPgSql(sql) {
  let i = 1;
  return sql.replace(/\?/g, () => `$${i++}`);
}

async function executeQuery(sqlString, params = []) {
  if (usePostgres) {
    const pgSql = toPgSql(sqlString);
    const result = await pool(pgSql, params);
    return { rows: result, rowCount: result.length };
  }
  // ensure SQL.js is initialized and sqliteDb loaded
  if (!SQL) {
    const initSql = await initSqlJs({ locateFile: (file) => fileURLToPath(new URL(`../../node_modules/sql.js/dist/${file}`, import.meta.url)) });
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
      const upper = sqlString.trim().split(/\s+/)[0].toUpperCase();
      if (upper === 'SELECT' || upper === 'PRAGMA') {
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
        // persist DB file after write
        try {
          const data = sqliteDb.export();
          fs.writeFileSync(sqlitePath, Buffer.from(data));
        } catch (err) {
          // ignore persistence errors but log
          console.error('SQLite persist error:', err);
        }
        resolve({ rows: [], rowCount: 1 });
      }
    } catch (error) {
      reject(error);
    }
  });
}

export async function ensureDb() {
  if (dbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = (async () => {
      try {
        await executeQuery("SELECT 1 FROM users LIMIT 1");
        dbReady = true;
        return;
      } catch (e) {
        // proceed to bootstrap
      }
      await bootstrap();
    })().catch((error) => {
      dbInitPromise = null;
      console.error('Database bootstrap failed:', error);
      throw error;
    });
  }
  await dbInitPromise;
}

export async function query(sqlString, params = []) {
  try {
    await ensureDb();
    return await executeQuery(sqlString, params);
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

export async function run(sqlString, params = []) {
  return query(sqlString, params);
}

export async function get(sqlString, params = []) {
  const result = await query(sqlString, params);
  return result.rows[0];
}

async function migratePostingSchema() {
  if (usePostgres) {
    for (const table of POSTING_TABLES) {
      for (const col of POSTING_COLUMN_DEFS) {
        try {
          await executeQuery(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.pg}`);
        } catch (error) {
          if (!String(error.message).includes('duplicate column name')) {
            console.error(`Migration error on ${table}.${col.name}:`, error);
          }
        }
      }
      await executeQuery(`UPDATE ${table} SET postStatus = 'posted' WHERE postStatus IS NULL OR postStatus = ''`);
    }
    return;
  }

  // For SQL.js (SQLite) we'll attempt to run ALTER TABLE but ignore failures
  for (const table of POSTING_TABLES) {
    for (const col of POSTING_COLUMN_DEFS) {
      try {
        await executeQuery(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.sqlite}`);
      } catch (err) {
        // ignore
      }
    }
    try {
      await executeQuery(`UPDATE ${table} SET postStatus = 'posted' WHERE postStatus IS NULL OR postStatus = ''`);
    } catch (err) {
      // ignore
    }
  }
}

async function bootstrap() {
  await initTables();
  await migratePostingSchema();
  await seedIfEmpty();
  dbReady = true;
}

const POSTGRES_SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    companyName TEXT,
    taxRate REAL,
    currency TEXT,
    logoUrl TEXT,
    footerMessage TEXT,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'rep',
    active INTEGER DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    qty INTEGER DEFAULT 0,
    purchasePrice REAL DEFAULT 0,
    sellPrice REAL DEFAULT 0,
    expiryDate TEXT,
    threshold INTEGER DEFAULT 5,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance REAL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    balance REAL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    supplierId TEXT,
    supplierName TEXT,
    date TEXT,
    total REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    notes TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS purchase_items (
    id SERIAL PRIMARY KEY,
    purchaseId TEXT,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    price REAL,
    total REAL
  );
  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    customerName TEXT,
    date TEXT,
    total REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    paymentStatus TEXT DEFAULT 'unpaid',
    repId TEXT,
    repName TEXT,
    notes TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    saleId TEXT,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    price REAL,
    total REAL
  );
  CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'supplier',
    entityId TEXT,
    entityName TEXT,
    date TEXT,
    reason TEXT,
    total REAL DEFAULT 0,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS return_items (
    id SERIAL PRIMARY KEY,
    returnId TEXT,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    price REAL,
    total REAL
  );
  CREATE TABLE IF NOT EXISTS damaged (
    id TEXT PRIMARY KEY,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    date TEXT,
    reason TEXT,
    type TEXT DEFAULT 'تالف',
    value REAL,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT,
    date TEXT,
    amount REAL,
    description TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS stocktakes (
    id TEXT PRIMARY KEY,
    date TEXT,
    productId TEXT,
    productName TEXT,
    systemQty INTEGER,
    physicalQty INTEGER,
    difference INTEGER,
    status TEXT,
    notes TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    customerName TEXT,
    amount REAL,
    date TEXT,
    method TEXT DEFAULT 'cash',
    notes TEXT,
    repId TEXT,
    repName TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS supplier_payments (
    id TEXT PRIMARY KEY,
    supplierId TEXT,
    supplierName TEXT,
    amount REAL,
    date TEXT,
    method TEXT DEFAULT 'cash',
    notes TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`;
const SQLITE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    companyName TEXT,
    taxRate REAL,
    currency TEXT,
    logoUrl TEXT,
    footerMessage TEXT,
    updatedAt TEXT
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'rep',
    active INTEGER DEFAULT 1,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sku TEXT,
    category TEXT,
    qty INTEGER DEFAULT 0,
    purchasePrice REAL DEFAULT 0,
    sellPrice REAL DEFAULT 0,
    expiryDate TEXT,
    threshold INTEGER DEFAULT 5,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance REAL DEFAULT 0,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT,
    balance REAL DEFAULT 0,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY,
    supplierId TEXT,
    supplierName TEXT,
    date TEXT,
    total REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    notes TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchaseId TEXT,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    price REAL,
    total REAL
  );
  CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    customerName TEXT,
    date TEXT,
    total REAL DEFAULT 0,
    discount REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0,
    paymentStatus TEXT DEFAULT 'unpaid',
    repId TEXT,
    repName TEXT,
    notes TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    saleId TEXT,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    price REAL,
    total REAL
  );
  CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY,
    type TEXT DEFAULT 'supplier',
    entityId TEXT,
    entityName TEXT,
    date TEXT,
    reason TEXT,
    total REAL DEFAULT 0,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS return_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    returnId TEXT,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    price REAL,
    total REAL
  );
  CREATE TABLE IF NOT EXISTS damaged (
    id TEXT PRIMARY KEY,
    productId TEXT,
    productName TEXT,
    qty INTEGER,
    date TEXT,
    reason TEXT,
    type TEXT DEFAULT 'تالف',
    value REAL,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    category TEXT,
    date TEXT,
    amount REAL,
    description TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS stocktakes (
    id TEXT PRIMARY KEY,
    date TEXT,
    productId TEXT,
    productName TEXT,
    systemQty INTEGER,
    physicalQty INTEGER,
    difference INTEGER,
    status TEXT,
    notes TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    customerId TEXT,
    customerName TEXT,
    amount REAL,
    date TEXT,
    method TEXT DEFAULT 'cash',
    notes TEXT,
    repId TEXT,
    repName TEXT,
    postStatus TEXT DEFAULT 'pending',
    postedBy TEXT,
    postedByName TEXT,
    postedAt TEXT,
    createdBy TEXT,
    createdByName TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS supplier_payments (
    id TEXT PRIMARY KEY,
    supplierId TEXT,
    supplierName TEXT,
    amount REAL,
    date TEXT,
    method TEXT DEFAULT 'cash',
    notes TEXT,
    createdAt TEXT
  );
  CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    recordId TEXT NOT NULL,
    userId TEXT,
    userName TEXT,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

export async function initTables() {
  if (usePostgres) {
    const statements = POSTGRES_SCHEMA.split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sql of statements) {
      await pool(sql);
    }
    return;
  }

  // SQLite: execute statements via exec
  const statements = SQLITE_SCHEMA.split(';').map((s) => s.trim()).filter(Boolean);
  for (const sql of statements) {
    try {
      sqliteDb.exec(sql);
    } catch (err) {
      // ignore individual statement errors
    }
  }
}

export async function seedIfEmpty() {
  const result = await executeQuery('SELECT COUNT(*) as c FROM users');
  const count = parseInt(result.rows[0]?.c || '0', 10);
  if (count > 0) return;

  await executeQuery("INSERT INTO settings (id, companyName, taxRate, currency, footerMessage) VALUES (?,?,?,?,?)", ['1', 'شركتي التجارية', 15, 'د.ع', 'مرحبا بك في النظام']);

  await executeQuery('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U001', 'admin', 'admin123', 'مدير النظام', 'admin']);
}

export function isPostgres() {
  return usePostgres;
}
