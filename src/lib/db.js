import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
    seedIfEmpty();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullName TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'rep',
      active INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT (datetime('now'))
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
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      balance REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      balance REAL DEFAULT 0,
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      supplierId TEXT,
      supplierName TEXT,
      date TEXT,
      total REAL DEFAULT 0,
      paidAmount REAL DEFAULT 0,
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
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
      createdAt TEXT DEFAULT (datetime('now'))
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
      createdAt TEXT DEFAULT (datetime('now'))
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
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT,
      date TEXT,
      amount REAL,
      description TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
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
      createdAt TEXT DEFAULT (datetime('now'))
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
      createdAt TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS supplier_payments (
      id TEXT PRIMARY KEY,
      supplierId TEXT,
      supplierName TEXT,
      amount REAL,
      date TEXT,
      method TEXT DEFAULT 'cash',
      notes TEXT,
      createdAt TEXT DEFAULT (datetime('now'))
    );
  `);
}

function seedIfEmpty() {
  const count = db.prepare('SELECT COUNT(*) as c FROM products').get();
  if (count.c > 0) return;

  // Seed Users
  const insertUser = db.prepare(
    'INSERT INTO users (id, username, password, fullName, role) VALUES (?,?,?,?,?)'
  );
  insertUser.run('U001', 'admin', 'admin123', 'مدير النظام', 'admin');
  insertUser.run('U002', 'accountant', 'acc123', 'أحمد المحاسب', 'accountant');
  insertUser.run('U003', 'rep_ahmed', 'rep123', 'أحمد المندوب', 'rep');
  insertUser.run('U004', 'rep_sara', 'rep123', 'سارة المندوبة', 'rep');

  // Seed Products
  const insertProduct = db.prepare(
    'INSERT INTO products (id, name, sku, category, qty, purchasePrice, sellPrice, expiryDate, threshold) VALUES (?,?,?,?,?,?,?,?,?)'
  );
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
  const seedProducts = db.transaction(() => {
    for (const p of products) insertProduct.run(...p);
  });
  seedProducts();

  // Seed Suppliers
  const insertSupplier = db.prepare(
    'INSERT INTO suppliers (id, name, phone, email, balance) VALUES (?,?,?,?,?)'
  );
  insertSupplier.run('S201','شركة البركة للمواد الغذائية','0501112223','info@baraka.com',1200);
  insertSupplier.run('S202','مصانع الألبان المتحدة','0504445556','sales@uniteddairy.com',0);
  insertSupplier.run('S203','شركة المنظفات الوطنية','0506667778','clean@nat.com',500);
  insertSupplier.run('S204','مؤسسة المشروبات الطازجة','0508889990','fresh@drinks.com',300);

  // Seed Customers
  const insertCustomer = db.prepare(
    'INSERT INTO customers (id, name, phone, balance) VALUES (?,?,?,?)'
  );
  insertCustomer.run('C301','سوبرماركت النجمة','0507778889',450);
  insertCustomer.run('C302','أسواق المدينة الاستهلاكية','0509990001',1100);
  insertCustomer.run('C303','بقالة الأمانة','0501234567',0);
  insertCustomer.run('C304','ميني ماركت الحي','0502345678',250);

  // Seed Purchases
  db.prepare(
    'INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount) VALUES (?,?,?,?,?,?)'
  ).run('INV-P001','S201','شركة البركة للمواد الغذائية','2026-05-15',2000,800);
  db.prepare(
    'INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-P001','P101','أرز بسمتي فاخر 5كجم',50,40,2000);

  db.prepare(
    'INSERT INTO purchases (id, supplierId, supplierName, date, total, paidAmount) VALUES (?,?,?,?,?,?)'
  ).run('INV-P002','S202','مصانع الألبان المتحدة','2026-05-20',500,500);
  db.prepare(
    'INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-P002','P103','حليب كامل الدسم 1 لتر',100,4,400);
  db.prepare(
    'INSERT INTO purchase_items (purchaseId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-P002','P105','جبنة شيدر قالب 1 كجم',4,25,100);

  // Seed Sales
  db.prepare(
    'INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run('INV-S001','C301','سوبرماركت النجمة','2026-06-01',495,495,'paid','U003','أحمد المندوب');
  db.prepare(
    'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-S001','P101','أرز بسمتي فاخر 5كجم',5,55,275);
  db.prepare(
    'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-S001','P102','زيت دوار الشمس 1.5 لتر',10,22,220);

  db.prepare(
    'INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run('INV-S002','C302','أسواق المدينة الاستهلاكية','2026-06-03',100,0,'unpaid','U004','سارة المندوبة');
  db.prepare(
    'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-S002','P104','مكرونة إيطالية 500 جرام',20,5,100);

  db.prepare(
    'INSERT INTO sales (id, customerId, customerName, date, total, paidAmount, paymentStatus, repId, repName) VALUES (?,?,?,?,?,?,?,?,?)'
  ).run('INV-S003','C304','ميني ماركت الحي','2026-06-04',250,0,'unpaid','U003','أحمد المندوب');
  db.prepare(
    'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-S003','P109','شاي أخضر 100 كيس',10,12,120);
  db.prepare(
    'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-S003','P110','سكر أبيض 1 كجم',20,4.5,90);
  db.prepare(
    'INSERT INTO sale_items (saleId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('INV-S003','P108','معجون طماطم 400 جرام',10,4,40);

  // Seed Returns
  db.prepare(
    'INSERT INTO returns (id, type, entityId, entityName, date, reason, total) VALUES (?,?,?,?,?,?,?)'
  ).run('RET-001','supplier','S201','شركة البركة للمواد الغذائية','2026-05-18','أكياس ممزقة',80);
  db.prepare(
    'INSERT INTO return_items (returnId, productId, productName, qty, price, total) VALUES (?,?,?,?,?,?)'
  ).run('RET-001','P101','أرز بسمتي فاخر 5كجم',2,40,80);

  // Seed Damaged
  db.prepare(
    'INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value) VALUES (?,?,?,?,?,?,?,?)'
  ).run('DMG-001','P103','حليب كامل الدسم 1 لتر',2,'2026-06-02','تلف بسبب انقطاع التبريد','تالف',8);
  db.prepare(
    'INSERT INTO damaged (id, productId, productName, qty, date, reason, type, value) VALUES (?,?,?,?,?,?,?,?)'
  ).run('DMG-002','P105','جبنة شيدر قالب 1 كجم',1,'2026-05-25','انتهاء صلاحية','منتهي الصلاحية',25);

  // Seed Expenses
  const insertExpense = db.prepare(
    'INSERT INTO expenses (id, category, date, amount, description) VALUES (?,?,?,?,?)'
  );
  insertExpense.run('EXP-001','إيجارات','2026-06-01',1500,'إيجار المستودع الشهري');
  insertExpense.run('EXP-002','مرتبات','2026-06-02',3000,'راتب المحاسب');
  insertExpense.run('EXP-003','تشغيلية','2026-06-04',150,'فاتورة الكهرباء');
  insertExpense.run('EXP-004','مرتبات','2026-06-05',2500,'راتب مندوب المبيعات');
  insertExpense.run('EXP-005','تشغيلية','2026-06-05',200,'صيانة المكيفات');

  // Seed Stocktake
  db.prepare(
    'INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status) VALUES (?,?,?,?,?,?,?,?)'
  ).run('STK-001','2026-05-30','P101','أرز بسمتي فاخر 5كجم',52,52,0,'مطابق');
  db.prepare(
    'INSERT INTO stocktakes (id, date, productId, productName, systemQty, physicalQty, difference, status) VALUES (?,?,?,?,?,?,?,?)'
  ).run('STK-002','2026-05-30','P102','زيت دوار الشمس 1.5 لتر',60,58,-2,'عجز');

  // Seed Collections
  db.prepare(
    'INSERT INTO collections (id, customerId, customerName, amount, date, method, repId, repName) VALUES (?,?,?,?,?,?,?,?)'
  ).run('COL-001','C301','سوبرماركت النجمة',200,'2026-06-02','cash','U003','أحمد المندوب');
  db.prepare(
    'INSERT INTO collections (id, customerId, customerName, amount, date, method, repId, repName) VALUES (?,?,?,?,?,?,?,?)'
  ).run('COL-002','C302','أسواق المدينة الاستهلاكية',500,'2026-06-03','transfer','U004','سارة المندوبة');

  // Seed Supplier Payments
  db.prepare(
    'INSERT INTO supplier_payments (id, supplierId, supplierName, amount, date, method) VALUES (?,?,?,?,?,?)'
  ).run('SP-001','S201','شركة البركة للمواد الغذائية',800,'2026-05-15','cash');
}

export default getDb;
