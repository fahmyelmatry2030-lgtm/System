import { Pool } from 'pg';
import path from 'path';

function cleanConnectionString(url = '') {
  return url
    .replace(/[&?]channel_binding=[^&]*/gi, '')
    .replace(/\?&/, '?')
    .replace(/&&/g, '&')
    .replace(/\?$/, '');
}

const connectionString = cleanConnectionString(process.env.DATABASE_URL || process.env.POSTGRES_URL || '');
const usePostgres = !!connectionString;

let pool = null;
let sqliteDb = null;
let dbReady = false;
let dbInitPromise = null;

if (usePostgres) {
  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
  });
} else {
  const Database = (await import('better-sqlite3')).default;
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  sqliteDb = new Database(dbPath);
  sqliteDb.pragma('journal_mode = WAL');
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
    const result = await pool.query(toPgSql(sqlString), params);
    return { rows: result.rows, rowCount: result.rowCount };
  }

  const stmt = sqliteDb.prepare(sqlString);
  const isSelect = sqlString.trim().toUpperCase().startsWith('SELECT');
  if (isSelect) {
    const rows = stmt.all(...params);
    return { rows, rowCount: rows.length };
  }
  const result = stmt.run(...params);
  return { rows: [], rowCount: result.changes, rowsAffected: result.changes, lastInsertRowid: result.lastInsertRowid };
}

export async function ensureDb() {
  if (dbReady) return;
  if (!dbInitPromise) {
    dbInitPromise = bootstrap().catch((error) => {
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
  for (const table of POSTING_TABLES) {
    for (const col of POSTING_COLUMN_DEFS) {
      try {
        if (usePostgres) {
          await executeQuery(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${col.name} ${col.pg}`);
        } else {
          const columns = sqliteDb.prepare(`PRAGMA table_info(${table})`).all();
          if (!columns.some((c) => c.name === col.name)) {
            sqliteDb.exec(`ALTER TABLE ${table} ADD COLUMN ${col.name} ${col.sqlite}`);
          }
        }
      } catch (error) {
        if (!String(error.message).includes('duplicate column name')) {
          console.error(`Migration error on ${table}.${col.name}:`, error);
        }
      }
    }
    await executeQuery(`UPDATE ${table} SET postStatus = 'posted' WHERE postStatus IS NULL OR postStatus = ''`);
  }
}

async function bootstrap() {
  await initTables();
  await migratePostingSchema();
  await seedIfEmpty();
  dbReady = true;
}

const POSTGRES_SCHEMA = `
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
  );
`;

const SQLITE_TABLES = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
    fullName TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'rep', active INTEGER DEFAULT 1,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, sku TEXT, category TEXT, qty INTEGER DEFAULT 0,
    purchasePrice REAL DEFAULT 0, sellPrice REAL DEFAULT 0, expiryDate TEXT, threshold INTEGER DEFAULT 5,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, email TEXT, balance REAL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY, name TEXT NOT NULL, phone TEXT, balance REAL DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS purchases (
    id TEXT PRIMARY KEY, supplierId TEXT, supplierName TEXT, date TEXT, total REAL DEFAULT 0,
    paidAmount REAL DEFAULT 0, notes TEXT, postStatus TEXT DEFAULT 'pending', postedBy TEXT,
    postedByName TEXT, postedAt TEXT, createdBy TEXT, createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, purchaseId TEXT, productId TEXT, productName TEXT,
    qty INTEGER, price REAL, total REAL
  )`,
  `CREATE TABLE IF NOT EXISTS sales (
    id TEXT PRIMARY KEY, customerId TEXT, customerName TEXT, date TEXT, total REAL DEFAULT 0,
    discount REAL DEFAULT 0, paidAmount REAL DEFAULT 0, paymentStatus TEXT DEFAULT 'unpaid',
    repId TEXT, repName TEXT, notes TEXT, postStatus TEXT DEFAULT 'pending', postedBy TEXT,
    postedByName TEXT, postedAt TEXT, createdBy TEXT, createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, saleId TEXT, productId TEXT, productName TEXT,
    qty INTEGER, price REAL, total REAL
  )`,
  `CREATE TABLE IF NOT EXISTS returns (
    id TEXT PRIMARY KEY, type TEXT DEFAULT 'supplier', entityId TEXT, entityName TEXT, date TEXT,
    reason TEXT, total REAL DEFAULT 0, postStatus TEXT DEFAULT 'pending', postedBy TEXT,
    postedByName TEXT, postedAt TEXT, createdBy TEXT, createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS return_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT, returnId TEXT, productId TEXT, productName TEXT,
    qty INTEGER, price REAL, total REAL
  )`,
  `CREATE TABLE IF NOT EXISTS damaged (
    id TEXT PRIMARY KEY, productId TEXT, productName TEXT, qty INTEGER, date TEXT, reason TEXT,
    type TEXT DEFAULT 'تالف', value REAL, postStatus TEXT DEFAULT 'pending', postedBy TEXT,
    postedByName TEXT, postedAt TEXT, createdBy TEXT, createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY, category TEXT, date TEXT, amount REAL, description TEXT,
    postStatus TEXT DEFAULT 'pending', postedBy TEXT, postedByName TEXT, postedAt TEXT,
    createdBy TEXT, createdByName TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS stocktakes (
    id TEXT PRIMARY KEY, date TEXT, productId TEXT, productName TEXT, systemQty INTEGER,
    physicalQty INTEGER, difference INTEGER, status TEXT, notes TEXT, postStatus TEXT DEFAULT 'pending',
    postedBy TEXT, postedByName TEXT, postedAt TEXT, createdBy TEXT, createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY, customerId TEXT, customerName TEXT, amount REAL, date TEXT,
    method TEXT DEFAULT 'cash', notes TEXT, repId TEXT, repName TEXT, postStatus TEXT DEFAULT 'pending',
    postedBy TEXT, postedByName TEXT, postedAt TEXT, createdBy TEXT, createdByName TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS supplier_payments (
    id TEXT PRIMARY KEY, supplierId TEXT, supplierName TEXT, amount REAL, date TEXT,
    method TEXT DEFAULT 'cash', notes TEXT, createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
];

export async function initTables() {
  if (usePostgres) {
    const statements = POSTGRES_SCHEMA.split(';')
      .map((s) => s.trim())
      .filter(Boolean);
    for (const sql of statements) {
      await pool.query(sql);
    }
  } else {
    for (const table of SQLITE_TABLES) {
      await executeQuery(table);
    }
  }
}

export async function seedIfEmpty() {
  const result = await executeQuery('SELECT COUNT(*) as c FROM products');
  const count = parseInt(result.rows[0]?.c || '0', 10);
  if (count > 0) return;

  await executeQuery('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U001', 'admin', 'admin123', 'مدير النظام', 'admin']);
  await executeQuery('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U002', 'accountant', 'acc123', 'أحمد المحاسب', 'accountant']);
  await executeQuery('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U003', 'rep_ahmed', 'rep123', 'أحمد المندوب', 'rep']);
  await executeQuery('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U004', 'rep_sara', 'rep123', 'سارة المندوبة', 'rep']);

  const products = [
    ['P101','أرز بسمتي فاخر 5كجم','SKU-RICE-01','غذائية',45,40,55,'2026-08-15',10],
    ['P102','زيت دوار الشمس 1.5 لتر','SKU-OIL-02','غذائية',60,15,22,'2026-12-20',15],
    ['P103','حليب كامل الدسم 1 لتر','SKU-MILK-03','ألبان',8,4,6,'2026-06-12',10],
    ['P104','مكرونة إيطالية 500 جرام','SKU-PASTA-04','غذائية',120,3.5,5,'2027-02-10',20],
    ['P105','جبنة شيدر قالب 1 كجم','SKU-CHEESE-05','ألبان',0,25,38,'2026-05-01',5],
    ['P106','عصير برتقال طبيعي 1 لتر','SKU-JUICE-06','مشروبات',30,5,8,'2026-09-01',10],
    ['P107','صابون سائل للأطباق 750 مل','SKU-SOAP-07','منظفات',50,3,5.5,'2027-06-01',15],
    ['P108','معجون طماطم 400 جرام','SKU-TOM-08','غذائية',80,2.5,4,'2026-11-15',20],
    ['P109','شاي أخضر 100 كيس','SKU-TEA-09','مشروبات',35,8,12,'2027-03-20',10],
    ['P110','سكر أبيض 1 كجم','SKU-SUGAR-10','غذائية',90,3,4.5,'2027-01-15',25],
  ];
  for (const p of products) {
    await executeQuery('INSERT INTO products (id, name, sku, category, qty, purchasePrice, sellPrice, expiryDate, threshold) VALUES (?,?,?,?,?,?,?,?,?)', p);
  }

  await executeQuery('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S201','شركة البركة للمواد الغذائية','0501112223','info@baraka.com',1200]);
  await executeQuery('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S202','مصانع الألبان المتحدة','0504445556','sales@uniteddairy.com',0]);
  await executeQuery('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S203','شركة المنظفات الوطنية','0506667778','clean@nat.com',500]);
  await executeQuery('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S204','مؤسسة المشروبات الطازجة','0508889990','fresh@drinks.com',300]);

  await executeQuery('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C301','سوبرماركت النجمة','0507778889',450]);
  await executeQuery('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C302','أسواق المدينة الاستهلاكية','0509990001',1100]);
  await executeQuery('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C303','بقالة الأمانة','0501234567',0]);
  await executeQuery('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C304','ميني ماركت الحي','0502345678',250]);

  await executeQuery("INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount, postStatus) VALUES (?,?,?,?,?,?,?)", ['INV-P001','S201','شركة البركة للمواد الغذائية','2026-05-15',2000,800,'posted']);
  await executeQuery('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-P001','P101','أرز بسمتي فاخر 5كجم',50,40,2000]);
  await executeQuery("INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount, postStatus) VALUES (?,?,?,?,?,?,?)", ['INV-P002','S202','مصانع الألبان المتحدة','2026-05-20',500,500,'posted']);
  await executeQuery('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-P002','P103','حليب كامل الدسم 1 لتر',100,4,400]);
  await executeQuery('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-P002','P105','جبنة شيدر قالب 1 كجم',4,25,100]);

  await executeQuery("INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, postStatus) VALUES (?,?,?,?,?,?,?,?,?,?)", ['INV-S001','C301','سوبرماركت النجمة','2026-06-01',495,495,'paid','U003','أحمد المندوب','posted']);
  await executeQuery('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S001','P101','أرز بسمتي فاخر 5كجم',5,55,275]);
  await executeQuery('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S001','P102','زيت دوار الشمس 1.5 لتر',10,22,220]);
  await executeQuery("INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, postStatus) VALUES (?,?,?,?,?,?,?,?,?,?)", ['INV-S002','C302','أسواق المدينة الاستهلاكية','2026-06-03',100,0,'unpaid','U004','سارة المندوبة','posted']);
  await executeQuery('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S002','P104','مكرونة إيطالية 500 جرام',20,5,100]);
  await executeQuery("INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName, postStatus) VALUES (?,?,?,?,?,?,?,?,?,?)", ['INV-S003','C304','ميني ماركت الحي','2026-06-04',250,0,'unpaid','U003','أحمد المندوب','posted']);
  await executeQuery('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S003','P109','شاي أخضر 100 كيس',10,12,120]);
  await executeQuery('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S003','P110','سكر أبيض 1 كجم',20,4.5,90]);
  await executeQuery('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S003','P108','معجون طماطم 400 جرام',10,4,40]);

  await executeQuery("INSERT INTO returns (id, type, entityId, entityName, date, reason, total, postStatus) VALUES (?,?,?,?,?,?,?,?)", ['RET-001','supplier','S201','شركة البركة للمواد الغذائية','2026-05-18','أكياس ممزقة',80,'posted']);
  await executeQuery('INSERT INTO return_items (returnId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['RET-001','P101','أرز بسمتي فاخر 5كجم',2,40,80]);

  await executeQuery("INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value, postStatus) VALUES (?,?,?,?,?,?,?,?,?)", ['DMG-001','P103','حليب كامل الدسم 1 لتر',2,'2026-06-02','تلف بسبب انقطاع التبريد','تالف',8,'posted']);
  await executeQuery("INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value, postStatus) VALUES (?,?,?,?,?,?,?,?,?)", ['DMG-002','P105','جبنة شيدر قالب 1 كجم',1,'2026-05-25','انتهاء صلاحية','منتهي الصلاحية',25,'posted']);

  await executeQuery("INSERT INTO expenses (id, category, date, amount, description, postStatus) VALUES (?,?,?,?,?,?)", ['EXP-001','إيجارات','2026-06-01',1500,'إيجار المستودع الشهري','posted']);
  await executeQuery("INSERT INTO expenses (id, category, date, amount, description, postStatus) VALUES (?,?,?,?,?,?)", ['EXP-002','مرتبات','2026-06-02',3000,'راتب المحاسب','posted']);
  await executeQuery("INSERT INTO expenses (id, category, date, amount, description, postStatus) VALUES (?,?,?,?,?,?)", ['EXP-003','تشغيلية','2026-06-04',150,'فاتورة الكهرباء','posted']);
  await executeQuery("INSERT INTO expenses (id, category, date, amount, description, postStatus) VALUES (?,?,?,?,?,?)", ['EXP-004','مرتبات','2026-06-05',2500,'راتب مندوب المبيعات','posted']);
  await executeQuery("INSERT INTO expenses (id, category, date, amount, description, postStatus) VALUES (?,?,?,?,?,?)", ['EXP-005','تشغيلية','2026-06-05',200,'صيانة المكيفات','posted']);

  await executeQuery("INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status, postStatus) VALUES (?,?,?,?,?,?,?,?,?)", ['STK-001','2026-05-30','P101','أرز بسمتي فاخر 5كجم',52,52,0,'مطابق','posted']);
  await executeQuery("INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status, postStatus) VALUES (?,?,?,?,?,?,?,?,?)", ['STK-002','2026-05-30','P102','زيت دوار الشمس 1.5 لتر',60,58,-2,'عجز','posted']);

  await executeQuery("INSERT INTO collections (id, customerId, customerName, amount, date, method, repId, repName, postStatus) VALUES (?,?,?,?,?,?,?,?,?)", ['COL-001','C301','سوبرماركت النجمة',200,'2026-06-02','cash','U003','أحمد المندوب','posted']);
  await executeQuery("INSERT INTO collections (id, customerId, customerName, amount, date, method, repId, repName, postStatus) VALUES (?,?,?,?,?,?,?,?,?)", ['COL-002','C302','أسواق المدينة الاستهلاكية',500,'2026-06-03','transfer','U004','سارة المندوبة','posted']);

  await executeQuery('INSERT INTO supplier_payments (id, supplierId, supplierName, amount, date, method) VALUES (?,?,?,?,?,?)', ['SP-001','S201','شركة البركة للمواد الغذائية',800,'2026-05-15','cash']);
}

export function isPostgres() {
  return usePostgres;
}

