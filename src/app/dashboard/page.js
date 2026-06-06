import DashboardCard from '@/components/DashboardCard';
import { DollarSign, Wallet, LineChart, Receipt, Layers, Box, AlertTriangle, Users, ShoppingCart, ArrowDownLeft, FileText } from 'lucide-react';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export default async function Dashboard() {
  // Aggregate Queries
  const products = (await query('SELECT * FROM products')).rows;
  const sales = (await query('SELECT * FROM sales')).rows;
  const purchases = (await query('SELECT * FROM purchases')).rows;
  const suppliers = (await query('SELECT * FROM suppliers')).rows;
  const customers = (await query('SELECT * FROM customers')).rows;
  const expenses = (await query('SELECT * FROM expenses')).rows;
  const damaged = (await query('SELECT * FROM damaged')).rows;
  const categories = (await query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL')).rows;
  
  // Calculate Metrics
  const totalStockValue = products.reduce((acc, p) => acc + (p.qty * p.sellPrice), 0);
  const totalStockCost = products.reduce((acc, p) => acc + (p.qty * p.purchasePrice), 0);
  const expectedProfit = totalStockValue - totalStockCost;
  
  // Sales Metrics
  const totalSalesCount = sales.length;
  const totalSalesValue = sales.reduce((acc, s) => acc + s.total, 0);
  const totalPaidSales = sales.reduce((acc, s) => acc + s.paidAmount, 0);
  
  // Purchase Metrics
  const totalPurchasesCount = purchases.length;
  const totalPurchasesValue = purchases.reduce((acc, p) => acc + p.total, 0);
  const totalPaidPurchases = purchases.reduce((acc, p) => acc + p.paidAmount, 0);
  
  // Sales Profit Calculation
  const saleItems = (await query(`
    SELECT si.*, p.purchasePrice 
    FROM sale_items si 
    LEFT JOIN products p ON si.productId = p.id
  `)).rows;
  const salesProfit = saleItems.reduce((acc, item) => {
    const cost = (item.purchasePrice || 0) * item.qty;
    return acc + (item.total - cost);
  }, 0);

  // Expenses
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const totalDamagedValue = damaged.reduce((acc, d) => acc + d.value, 0);

  const totalQuantity = products.reduce((acc, p) => acc + p.qty, 0);
  const totalProducts = products.length;
  const totalSuppliers = suppliers.length;
  const totalCustomers = customers.length;
  const totalCategories = categories.length;

  // Expired products
  const today = new Date().toISOString().split('T')[0];
  const expiredCount = products.filter(p => p.expiryDate && p.expiryDate < today).length;

  // Low stock
  const lowStockCount = products.filter(p => p.qty <= p.threshold).length;

  // Customer debt
  const totalCustomerDebt = customers.reduce((acc, c) => acc + c.balance, 0);

  // Supplier debt
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + s.balance, 0);

  const formatCurrency = (num) => new Intl.NumberFormat('en-US').format(num) + ' ﷼';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm shadow-sm">📊</span>
          لوحة القيادة
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <DashboardCard 
          title="قيمة المخزون" 
          value={formatCurrency(totalStockValue)} 
          icon={Wallet} 
          colorClass="bg-gradient-to-br from-[#4ade80] to-[#22c55e]" 
        />
        <DashboardCard 
          title="قيمة التكلفة" 
          value={formatCurrency(totalStockCost)} 
          icon={DollarSign} 
          colorClass="bg-gradient-to-br from-[#fb923c] to-[#f97316]" 
        />
        <DashboardCard 
          title="الربح المتوقع" 
          value={formatCurrency(expectedProfit)} 
          icon={LineChart} 
          colorClass="bg-gradient-to-br from-[#60a5fa] to-[#3b82f6]" 
        />
        <DashboardCard 
          title="المبيعات والربح" 
          value={formatCurrency(totalSalesValue)} 
          icon={Receipt} 
          colorClass="bg-gradient-to-br from-[#c084fc] to-[#a855f7]" 
          subtitle1="المبيعات" val2={formatCurrency(totalSalesValue)}
          subtitle2="الربح" val3={formatCurrency(salesProfit)}
        />
        
        <DashboardCard 
          title="إجمالي الكميات" 
          value={totalQuantity.toLocaleString()} 
          icon={Layers} 
          colorClass="bg-gradient-to-br from-[#818cf8] to-[#6366f1]" 
        />
        <DashboardCard 
          title="عدد فواتير البيع" 
          value={totalSalesCount.toLocaleString()} 
          icon={ShoppingCart} 
          colorClass="bg-gradient-to-br from-[#4b5563] to-[#374151]" 
        />
        <DashboardCard 
          title="عدد المنتجات" 
          value={totalProducts.toLocaleString()} 
          icon={Box} 
          colorClass="bg-gradient-to-br from-[#2dd4bf] to-[#14b8a6]" 
        />
        <DashboardCard 
          title="منتجات منتهية الصلاحية" 
          value={expiredCount.toLocaleString()} 
          icon={AlertTriangle} 
          colorClass="bg-gradient-to-br from-[#fb7185] to-[#f43f5e]" 
        />

        <DashboardCard 
          title="عدد الموردين" 
          value={totalSuppliers.toLocaleString()} 
          icon={Users} 
          colorClass="bg-gradient-to-br from-[#334155] to-[#0f172a]" 
        />
        <DashboardCard 
          title="عدد العملاء" 
          value={totalCustomers.toLocaleString()} 
          icon={Users} 
          colorClass="bg-gradient-to-br from-[#38bdf8] to-[#0ea5e9]" 
        />
        <DashboardCard 
          title="الفئات" 
          value={totalCategories.toLocaleString()} 
          icon={FileText} 
          colorClass="bg-gradient-to-br from-[#86efac] to-[#22c55e]" 
        />
        <DashboardCard 
          title="منتجات منخفضة الرصيد" 
          value={lowStockCount.toLocaleString()} 
          icon={AlertTriangle} 
          colorClass="bg-gradient-to-br from-[#fca5a5] to-[#ef4444]" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">ملخص مالي</h3>
          <p className="text-sm text-gray-500 mb-6">نظرة عامة على الوضع المالي</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">إجمالي المبيعات</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalSalesValue)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">إجمالي المشتريات</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totalPurchasesValue)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">المصروفات</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl">
              <p className="text-sm text-gray-500 mb-1">خسائر التوالف</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalDamagedValue)}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl col-span-2">
              <p className="text-sm text-gray-500 mb-1">صافي الربح التقديري</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(salesProfit - totalExpenses - totalDamagedValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">الأرصدة المستحقة</h3>
          <p className="text-sm text-gray-500 mb-6">ديون العملاء والموردين</p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 <span className="text-sm font-semibold text-gray-700">ديون العملاء</span>
               </div>
               <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">{formatCurrency(totalCustomerDebt)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <span className="text-sm font-semibold text-gray-700">ديون الموردين</span>
               </div>
               <span className="text-sm font-bold text-gray-900 bg-white px-3 py-1 rounded-lg shadow-sm">{formatCurrency(totalSupplierDebt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
