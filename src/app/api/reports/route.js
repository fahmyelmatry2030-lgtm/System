import getDb from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    const db = getDb();
    let data = {};

    if (type === 'financial') {
      const sales = db.prepare('SELECT SUM(total) as total, SUM(paidAmount) as paid FROM sales').get();
      const purchases = db.prepare('SELECT SUM(total) as total, SUM(paidAmount) as paid FROM purchases').get();
      const expenses = db.prepare('SELECT SUM(amount) as total FROM expenses').get();
      const damaged = db.prepare('SELECT SUM(value) as total FROM damaged').get();
      
      data = {
        totalSales: sales.total || 0,
        paidSales: sales.paid || 0,
        totalPurchases: purchases.total || 0,
        paidPurchases: purchases.paid || 0,
        totalExpenses: expenses.total || 0,
        totalDamaged: damaged.total || 0,
        netProfit: (sales.total || 0) - (purchases.total || 0) - (expenses.total || 0) - (damaged.total || 0)
      };
    } else if (type === 'inventory') {
      data.products = db.prepare('SELECT COUNT(*) as count, SUM(qty * purchasePrice) as value FROM products').get();
      data.lowStock = db.prepare('SELECT * FROM products WHERE qty <= threshold').all();
    } else if (type === 'debt') {
      data.customers = db.prepare('SELECT id, name, balance FROM customers WHERE balance > 0 ORDER BY balance DESC').all();
      data.suppliers = db.prepare('SELECT id, name, balance FROM suppliers WHERE balance > 0 ORDER BY balance DESC').all();
    } else if (type === 'sales') {
      let query = 'SELECT * FROM sales';
      let params = [];
      
      if (startDate && endDate) {
        query += ' WHERE date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }
      
      query += ' ORDER BY date DESC';
      const sales = db.prepare(query).all(...params);
      
      data.sales = sales;
      data.totalSales = sales.reduce((sum, s) => sum + s.total, 0);
      data.totalPaid = sales.reduce((sum, s) => sum + s.paidAmount, 0);
      data.totalRemaining = data.totalSales - data.totalPaid;
      
      // Group by rep
      const byRep = {};
      sales.forEach(s => {
        const repName = s.repName || 'غير محدد';
        if (!byRep[repName]) {
          byRep[repName] = { repName, count: 0, total: 0 };
        }
        byRep[repName].count++;
        byRep[repName].total += s.total;
      });
      data.byRep = Object.values(byRep);
    } else if (type === 'purchases') {
      const purchases = db.prepare('SELECT * FROM purchases ORDER BY date DESC').all();
      
      data.purchases = purchases;
      data.totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
      data.totalPaid = purchases.reduce((sum, p) => sum + p.paidAmount, 0);
      data.totalRemaining = data.totalPurchases - data.totalPaid;
      
      // Group by supplier
      const bySupplier = {};
      purchases.forEach(p => {
        const supplierName = p.supplierName;
        if (!bySupplier[supplierName]) {
          bySupplier[supplierName] = { supplierName, count: 0, total: 0 };
        }
        bySupplier[supplierName].count++;
        bySupplier[supplierName].total += p.total;
      });
      data.bySupplier = Object.values(bySupplier);
    } else if (type === 'stocktake') {
      const stocktakes = db.prepare('SELECT * FROM stocktakes ORDER BY date DESC').all();
      
      data.stocktakes = stocktakes;
      data.surplus = stocktakes.filter(st => st.status === 'surplus').reduce((sum, st) => sum + Math.abs(st.difference * st.purchasePrice || 0), 0);
      data.deficit = stocktakes.filter(st => st.status === 'deficit').reduce((sum, st) => sum + Math.abs(st.difference * st.purchasePrice || 0), 0);
    } else if (type === 'damaged') {
      const damaged = db.prepare('SELECT * FROM damaged ORDER BY date DESC').all();
      const today = new Date().toISOString().split('T')[0];
      const expired = db.prepare('SELECT * FROM products WHERE expiryDate < ?').all(today);
      
      data.damaged = damaged;
      data.totalLoss = damaged.reduce((sum, d) => sum + d.value, 0);
      data.expired = expired;
    } else if (type === 'collections') {
      const collections = db.prepare('SELECT * FROM collections ORDER BY date DESC').all();
      const totalDebt = db.prepare('SELECT SUM(balance) as total FROM customers').get().total || 0;
      
      data.collections = collections;
      data.totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
      data.totalDebt = totalDebt;
    } else {
      // Basic summary
      data.salesCount = db.prepare('SELECT COUNT(*) as c FROM sales').get().c;
      data.purchasesCount = db.prepare('SELECT COUNT(*) as c FROM purchases').get().c;
      data.customersCount = db.prepare('SELECT COUNT(*) as c FROM customers').get().c;
      data.productsCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
