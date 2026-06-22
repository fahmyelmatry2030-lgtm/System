import { query } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    
    let data = {};

    if (type === 'financial') {
      const sales = (await query("SELECT SUM(total) as total, SUM(paidAmount) as paid FROM sales WHERE postStatus = 'posted'")).rows[0];
      const purchases = (await query("SELECT SUM(total) as total, SUM(paidAmount) as paid FROM purchases WHERE postStatus = 'posted'")).rows[0];
      const expenses = (await query("SELECT SUM(amount) as total FROM expenses WHERE postStatus = 'posted'")).rows[0];
      const damaged = (await query("SELECT SUM(value) as total FROM damaged WHERE postStatus = 'posted'")).rows[0];
      
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
      data.products = (await query('SELECT COUNT(*) as count, SUM(qty * purchasePrice) as value FROM products')).rows[0];
      data.lowStock = (await query('SELECT * FROM products WHERE qty <= threshold')).rows;
    } else if (type === 'debt') {
      data.customers = (await query('SELECT id, name, balance FROM customers WHERE balance > 0 ORDER BY balance DESC')).rows;
      data.suppliers = (await query('SELECT id, name, balance FROM suppliers WHERE balance > 0 ORDER BY balance DESC')).rows;
    } else if (type === 'sales') {
      let sqlQuery = "SELECT * FROM sales";  // ✅ عرض جميع المبيعات (مرحّلة وغير مرحّلة)
      let params = [];
      
      if (startDate && endDate) {
        sqlQuery += ' WHERE date BETWEEN ? AND ?';
        params.push(startDate, endDate);
      }
      
      sqlQuery += ' ORDER BY date DESC';
      const sales = (await query(sqlQuery, params)).rows;
      
      data.sales = sales;
      data.totalSales = sales.reduce((sum, s) => sum + s.total, 0);
      data.totalPaid = sales.reduce((sum, s) => sum + (s.paidamount || s.paidAmount || 0), 0);
      data.totalRemaining = data.totalSales - data.totalPaid;
      
      // Group by rep
      const byRep = {};
      sales.forEach(s => {
        const repName = s.repname || s.repName || 'غير محدد';
        if (!byRep[repName]) {
          byRep[repName] = { repName, count: 0, total: 0 };
        }
        byRep[repName].count++;
        byRep[repName].total += s.total;
      });
      data.byRep = Object.values(byRep);
    } else if (type === 'purchases') {
      const purchases = (await query("SELECT * FROM purchases WHERE postStatus = 'posted' ORDER BY date DESC")).rows;
      
      data.purchases = purchases;
      data.totalPurchases = purchases.reduce((sum, p) => sum + p.total, 0);
      data.totalPaid = purchases.reduce((sum, p) => sum + p.paidamount, 0);
      data.totalRemaining = data.totalPurchases - data.totalPaid;
      
      // Group by supplier
      const bySupplier = {};
      purchases.forEach(p => {
        const supplierName = p.suppliername;
        if (!bySupplier[supplierName]) {
          bySupplier[supplierName] = { supplierName, count: 0, total: 0 };
        }
        bySupplier[supplierName].count++;
        bySupplier[supplierName].total += p.total;
      });
      data.bySupplier = Object.values(bySupplier);
    } else if (type === 'stocktake') {
      const stocktakes = (await query('SELECT * FROM stocktakes ORDER BY date DESC')).rows;
      
      data.stocktakes = stocktakes;
      data.surplus = stocktakes.filter(st => st.status === 'surplus').reduce((sum, st) => sum + Math.abs(st.difference * st.purchasePrice || 0), 0);
      data.deficit = stocktakes.filter(st => st.status === 'deficit').reduce((sum, st) => sum + Math.abs(st.difference * st.purchasePrice || 0), 0);
    } else if (type === 'damaged') {
      const damaged = (await query('SELECT * FROM damaged ORDER BY date DESC')).rows;
      const today = new Date().toISOString().split('T')[0];
      const expired = (await query('SELECT * FROM products WHERE expiryDate < ?', [today])).rows;
      
      data.damaged = damaged;
      data.totalLoss = damaged.reduce((sum, d) => sum + d.value, 0);
      data.expired = expired;
    } else if (type === 'collections') {
      const collections = (await query("SELECT * FROM collections WHERE postStatus = 'posted' ORDER BY date DESC")).rows;
      const totalDebtResult = (await query('SELECT SUM(balance) as total FROM customers')).rows[0];
      const totalDebt = totalDebtResult.total || 0;
      
      data.collections = collections;
      data.totalCollected = collections.reduce((sum, c) => sum + c.amount, 0);
      data.totalDebt = totalDebt;
    } else {
      // Basic summary
      data.salesCount = (await query('SELECT COUNT(*) as c FROM sales')).rows[0].c;
      data.purchasesCount = (await query('SELECT COUNT(*) as c FROM purchases')).rows[0].c;
      data.customersCount = (await query('SELECT COUNT(*) as c FROM customers')).rows[0].c;
      data.productsCount = (await query('SELECT COUNT(*) as c FROM products')).rows[0].c;
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
