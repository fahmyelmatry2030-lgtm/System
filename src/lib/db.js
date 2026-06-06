import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

export async function query(sqlString, params = []) {
  // Convert SQLite placeholders (?) to PostgreSQL placeholders ($1, $2, ...)
  let i = 1;
  const pgSql = sqlString.replace(/\?/g, () => `$${i++}`);
  
  try {
    const result = await pool.query(pgSql, params);
    return result;
  } catch (error) {
    console.error('Database Query Error:', error);
    throw error;
  }
}

export async function initTables() {
  await query(`
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
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT,
      date TEXT,
      amount REAL,
      description TEXT,
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
  `);
}

export async function seedIfEmpty() {
  const result = await query('SELECT COUNT(*) as c FROM products');
  const count = parseInt(result.rows[0].c);
  if (count > 0) return;

  // Seed Users
  await query('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U001', 'admin', 'admin123', 'مدير النظام', 'admin']);
  await query('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U002', 'accountant', 'acc123', 'أحمد المحاسب', 'accountant']);
  await query('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U003', 'rep_ahmed', 'rep123', 'أحمد المندوب', 'rep']);
  await query('INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)', ['U004', 'rep_sara', 'rep123', 'سارة المندوبة', 'rep']);

  // Seed Products
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
    await query('INSERT INTO products (id, name, sku, category, qty, purchasePrice, sellPrice, expiryDate, threshold) VALUES (?,?,?,?,?,?,?,?,?)', p);
  }

  // Seed Suppliers
  await query('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S201','شركة البركة للمواد الغذائية','0501112223','info@baraka.com',1200]);
  await query('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S202','مصانع الألبان المتحدة','0504445556','sales@uniteddairy.com',0]);
  await query('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S203','شركة المنظفات الوطنية','0506667778','clean@nat.com',500]);
  await query('INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)', ['S204','مؤسسة المشروبات الطازجة','0508889990','fresh@drinks.com',300]);

  // Seed Customers
  await query('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C301','سوبرماركت النجمة','0507778889',450]);
  await query('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C302','أسواق المدينة الاستهلاكية','0509990001',1100]);
  await query('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C303','بقالة الأمانة','0501234567',0]);
  await query('INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)', ['C304','ميني ماركت الحي','0502345678',250]);

  // Seed Purchases
  await query('INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount) VALUES (?,?,?,?,?,?)', ['INV-P001','S201','شركة البركة للمواد الغذائية','2026-05-15',2000,800]);
  await query('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-P001','P101','أرز بسمتي فاخر 5كجم',50,40,2000]);

  await query('INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount) VALUES (?,?,?,?,?,?)', ['INV-P002','S202','مصانع الألبان المتحدة','2026-05-20',500,500]);
  await query('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-P002','P103','حليب كامل الدسم 1 لتر',100,4,400]);
  await query('INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-P002','P105','جبنة شيدر قالب 1 كجم',4,25,100]);

  // Seed Sales
  await query('INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)', ['INV-S001','C301','سوبرماركت النجمة','2026-06-01',495,495,'paid','U003','أحمد المندوب']);
  await query('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S001','P101','أرز بسمتي فاخر 5كجم',5,55,275]);
  await query('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S001','P102','زيت دوار الشمس 1.5 لتر',10,22,220]);

  await query('INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)', ['INV-S002','C302','أسواق المدينة الاستهلاكية','2026-06-03',100,0,'unpaid','U004','سارة المندوبة']);
  await query('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S002','P104','مكرونة إيطالية 500 جرام',20,5,100]);

  await query('INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)', ['INV-S003','C304','ميني ماركت الحي','2026-06-04',250,0,'unpaid','U003','أحمد المندوب']);
  await query('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S003','P109','شاي أخضر 100 كيس',10,12,120]);
  await query('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S003','P110','سكر أبيض 1 كجم',20,4.5,90]);
  await query('INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['INV-S003','P108','معجون طماطم 400 جرام',10,4,40]);

  // Seed Returns
  await query('INSERT INTO returns (id, type, entityId, entityName, date, reason, total) VALUES (?,?,?,?,?,?,?)', ['RET-001','supplier','S201','شركة البركة للمواد الغذائية','2026-05-18','أكياس ممزقة',80]);
  await query('INSERT INTO return_items (returnId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)', ['RET-001','P101','أرز بسمتي فاخر 5كجم',2,40,80]);

  // Seed Damaged
  await query('INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value) VALUES (?,?,?,?,?,?,?,?)', ['DMG-001','P103','حليب كامل الدسم 1 لتر',2,'2026-06-02','تلف بسبب انقطاع التبريد','تالف',8]);
  await query('INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value) VALUES (?,?,?,?,?,?,?,?)', ['DMG-002','P105','جبنة شيدر قالب 1 كجم',1,'2026-05-25','انتهاء صلاحية','منتهي الصلاحية',25]);

  // Seed Expenses
  await query('INSERT INTO expenses (id, category, date, amount, description) VALUES (?,?,?,?,?)', ['EXP-001','إيجارات','2026-06-01',1500,'إيجار المستودع الشهري']);
  await query('INSERT INTO expenses (id, category, date, amount, description) VALUES (?,?,?,?,?)', ['EXP-002','مرتبات','2026-06-02',3000,'راتب المحاسب']);
  await query('INSERT INTO expenses (id, category, date, amount, description) VALUES (?,?,?,?,?)', ['EXP-003','تشغيلية','2026-06-04',150,'فاتورة الكهرباء']);
  await query('INSERT INTO expenses (id, category, date, amount, description) VALUES (?,?,?,?,?)', ['EXP-004','مرتبات','2026-06-05',2500,'راتب مندوب المبيعات']);
  await query('INSERT INTO expenses (id, category, date, amount, description) VALUES (?,?,?,?,?)', ['EXP-005','تشغيلية','2026-06-05',200,'صيانة المكيفات']);

  // Seed Stocktake
  await query('INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status) VALUES (?,?,?,?,?,?,?,?)', ['STK-001','2026-05-30','P101','أرز بسمتي فاخر 5كجم',52,52,0,'مطابق']);
  await query('INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status) VALUES (?,?,?,?,?,?,?,?)', ['STK-002','2026-05-30','P102','زيت دوار الشمس 1.5 لتر',60,58,-2,'عجز']);

  // Seed Collections
  await query('INSERT INTO collections (id, customerId, customerName, amount, date, method, repId, repName) VALUES (?,?,?,?,?,?,?,?)', ['COL-001','C301','سوبرماركت النجمة',200,'2026-06-02','cash','U003','أحمد المندوب']);
  await query('INSERT INTO collections (id, customerId, customerName, amount, date, method, repId, repName) VALUES (?,?,?,?,?,?,?,?)', ['COL-002','C302','أسواق المدينة الاستهلاكية',500,'2026-06-03','transfer','U004','سارة المندوبة']);

  // Seed Supplier Payments
  await query('INSERT INTO supplier_payments (id, supplierId, supplierName, amount, date, method) VALUES (?,?,?,?,?,?)', ['SP-001','S201','شركة البركة للمواد الغذائية',800,'2026-05-15','cash']);
}

// Ensure tables exist on boot
initTables().then(seedIfEmpty).catch(console.error);

export default function getDb() {
  throw new Error("getDb() is deprecated. Use import { query } from '@/lib/db' instead.");
}
