import DashboardCard from '@/components/DashboardCard';
import PendingAlert from '@/components/PendingAlert';
import DashboardCharts from '@/components/DashboardCharts';
import { DollarSign, Wallet, LineChart, Receipt, Layers, Box, AlertTriangle, Users, ShoppingCart, ArrowDownLeft, FileText } from 'lucide-react';
import { query } from '@/lib/db';
import { formatCurrency } from '@/lib/currency';

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
    const salePrice = (item.price || 0) * (item.qty || 0);
    const cost = (item.purchasePrice || 0) * (item.qty || 0);
    return acc + (salePrice - cost);
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

  // Get current date and time in Iraq timezone (UTC+3)
  const iraqDateTime = new Date().toLocaleString('ar-IQ', { 
    timeZone: 'Asia/Baghdad',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Low stock
  const lowStockCount = products.filter(p => p.qty <= p.threshold).length;

  // Supplier debt - separated into loans and credits
  const suppliersWithLoans = suppliers.filter(s => s.balance < 0);
  const suppliersWithCredits = suppliers.filter(s => s.balance > 0);
  const totalSupplierDebt = suppliers.reduce((acc, s) => acc + Math.abs(s.balance > 0 ? 0 : s.balance), 0);
  const totalSupplierCredits = suppliers.reduce((acc, s) => acc + (s.balance > 0 ? s.balance : 0), 0);

  // Customer debt
  const totalCustomerDebt = customers.reduce((acc, c) => acc + (c.balance > 0 ? c.balance : 0), 0);

  // Posted and Pending records
  const postedSales = sales.filter(s => s.postStatus === 'posted').length;
  const pendingSales = sales.filter(s => s.postStatus !== 'posted').length;
  
  const postedPurchases = purchases.filter(p => p.postStatus === 'posted').length;
  const pendingPurchases = purchases.filter(p => p.postStatus !== 'posted').length;

  // Top debtors and creditors
  const topDebtorSuppliers = suppliers
    .filter(s => s.balance < 0)
    .sort((a, b) => a.balance - b.balance)
    .slice(0, 5);

  const topDebtorCustomers = customers
    .filter(c => c.balance > 0)
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  // Financial Summary
  const netProfit = salesProfit - totalExpenses - totalDamagedValue;
  const profitMargin = totalSalesValue > 0 ? (salesProfit / totalSalesValue * 100).toFixed(2) : 0;
  const unpaidSales = totalSalesValue - totalPaidSales;
  const unpaidPurchases = totalPurchasesValue - totalPaidPurchases;
  const totalCashFlow = totalPaidSales - totalPaidPurchases;
  
  // Cash position
  const estimatedCash = totalPaidSales - totalPaidPurchases - totalExpenses - totalDamagedValue;

  // Pending invoices
  const pendingSalesInvoices = sales.filter(s => s.postStatus !== 'posted').slice(0, 10);
  const pendingPurchaseInvoices = purchases.filter(p => p.postStatus !== 'posted').slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2 tracking-tight">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm shadow-sm">📊</span>
          لوحة القيادة
        </h2>
        <div className="text-sm text-gray-600 font-semibold">
          🕐 {iraqDateTime}
        </div>
      </div>

      <PendingAlert />

      {(expiredCount > 0 || lowStockCount > 0 || pendingSales > 5 || pendingPurchases > 5) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {expiredCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⚠️</span>
              </div>
              <div>
                <p className="font-bold text-red-900">{expiredCount} منتج منتهي الصلاحية</p>
                <p className="text-sm text-red-700 mt-1">يتطلب إجراء فوري</p>
              </div>
            </div>
          )}
          
          {lowStockCount > 0 && (
            <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📦</span>
              </div>
              <div>
                <p className="font-bold text-orange-900">{lowStockCount} منتج منخفض الرصيد</p>
                <p className="text-sm text-orange-700 mt-1">يحتاج إلى إعادة طلب</p>
              </div>
            </div>
          )}
          
          {pendingSales > 5 && (
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <p className="font-bold text-yellow-900">{pendingSales} فاتورة مبيعات معلقة</p>
                <p className="text-sm text-yellow-700 mt-1">انتظر الترحيل</p>
              </div>
            </div>
          )}
          
          {pendingPurchases > 5 && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🛒</span>
              </div>
              <div>
                <p className="font-bold text-blue-900">{pendingPurchases} فاتورة مشتريات معلقة</p>
                <p className="text-sm text-blue-700 mt-1">انتظر الترحيل</p>
              </div>
            </div>
          )}
        </div>
      )}

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

        <DashboardCard 
          title="المشتريات المعلقة" 
          value={pendingPurchases.toLocaleString()} 
          icon={FileText} 
          colorClass="bg-gradient-to-br from-[#fbbf24] to-[#f59e0b]" 
        />
        <DashboardCard 
          title="المشتريات المرحلة" 
          value={postedPurchases.toLocaleString()} 
          icon={FileText} 
          colorClass="bg-gradient-to-br from-[#93c5fd] to-[#3b82f6]" 
        />
        <DashboardCard 
          title="المبيعات المعلقة" 
          value={pendingSales.toLocaleString()} 
          icon={ShoppingCart} 
          colorClass="bg-gradient-to-br from-[#fed7aa] to-[#fb923c]" 
        />
        <DashboardCard 
          title="المبيعات المرحلة" 
          value={postedSales.toLocaleString()} 
          icon={ShoppingCart} 
          colorClass="bg-gradient-to-br from-[#bfdbfe] to-[#60a5fa]" 
        />
        <DashboardCard 
          title="قروض الموردين" 
          value={totalSupplierDebt.toLocaleString()} 
          icon={ArrowDownLeft} 
          colorClass="bg-gradient-to-br from-[#fca5a5] to-[#ef4444]" 
          subtitle1="عدد الموردين" val2={suppliersWithLoans.length}
        />
        <DashboardCard 
          title="أرصدة الموردين (مقدمات)" 
          value={formatCurrency(totalSupplierCredits)} 
          icon={Wallet} 
          colorClass="bg-gradient-to-br from-[#86efac] to-[#22c55e]" 
          subtitle1="عدد الموردين" val2={suppliersWithCredits.length}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">ملخص مالي</h3>
          <p className="text-sm text-gray-500 mb-6">نظرة عامة على الوضع المالي</p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <p className="text-sm text-gray-500 mb-1">إجمالي المبيعات</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalSalesValue)}</p>
              <p className="text-xs text-gray-500 mt-2">عدد الفواتير: {totalSalesCount}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <p className="text-sm text-gray-500 mb-1">إجمالي المشتريات</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(totalPurchasesValue)}</p>
              <p className="text-xs text-gray-500 mt-2">عدد الفواتير: {totalPurchasesCount}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl border border-red-200">
              <p className="text-sm text-gray-500 mb-1">المصروفات</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalExpenses)}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-xl border border-red-300">
              <p className="text-sm text-gray-500 mb-1">خسائر التوالف</p>
              <p className="text-xl font-bold text-red-600">{formatCurrency(totalDamagedValue)}</p>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl col-span-2 border border-blue-200">
              <p className="text-sm text-gray-500 mb-1">صافي الربح التقديري</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(salesProfit - totalExpenses - totalDamagedValue)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">الأرصدة والقروض</h3>
          <p className="text-sm text-gray-500 mb-6">حالة الديون والأرصدة المستحقة</p>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-200">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-green-500"></div>
                 <span className="text-sm font-semibold text-gray-700">ديون العملاء</span>
               </div>
               <span className="text-sm font-bold text-green-700 bg-white px-3 py-1 rounded-lg shadow-sm">{formatCurrency(totalCustomerDebt)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-200">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
                 <span className="text-sm font-semibold text-gray-700">قروض الموردين</span>
               </div>
               <span className="text-sm font-bold text-red-700 bg-white px-3 py-1 rounded-lg shadow-sm">{formatCurrency(totalSupplierDebt)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200">
               <div className="flex items-center gap-3">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                 <span className="text-sm font-semibold text-gray-700">أرصدة الموردين (مقدمات)</span>
               </div>
               <span className="text-sm font-bold text-blue-700 bg-white px-3 py-1 rounded-lg shadow-sm">{formatCurrency(totalSupplierCredits)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">📈 تحليل الربحية</h3>
          <p className="text-sm text-gray-500 mb-6">معدلات الربح والمؤشرات الأساسية</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">الربح الإجمالي</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(salesProfit)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">نسبة الربح</span>
              <span className="text-lg font-bold text-purple-600">{profitMargin}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-indigo-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">صافي الربح</span>
              <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
            <div className="flex justify-between items-center p-3 bg-cyan-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">التدفق النقدي</span>
              <span className={`text-lg font-bold ${totalCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalCashFlow)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">💳 حالة الدفعيات</h3>
          <p className="text-sm text-gray-500 mb-6">الفواتير المدفوعة والمعلقة</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">المبيعات المدفوعة</span>
              <span className="text-lg font-bold text-green-600">{formatCurrency(totalPaidSales)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">المبيعات المعلقة</span>
              <span className="text-lg font-bold text-yellow-600">{formatCurrency(unpaidSales)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">المشتريات المدفوعة</span>
              <span className="text-lg font-bold text-orange-600">{formatCurrency(totalPaidPurchases)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
              <span className="text-sm font-semibold text-gray-700">المشتريات المعلقة</span>
              <span className="text-lg font-bold text-red-600">{formatCurrency(unpaidPurchases)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">🏦 الوضع النقدي</h3>
          <p className="text-sm text-gray-500 mb-6">تقدير الرصيد النقدي الحالي</p>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg border-l-4 border-teal-500">
              <span className="text-sm font-semibold text-gray-700">التوقع النقدي</span>
              <span className={`text-xl font-bold ${estimatedCash >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                {formatCurrency(estimatedCash)}
              </span>
            </div>
            <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold mb-2">ملاحظة: هذا تقدير بناءً على:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>المبيعات المدفوعة - المشتريات - المصروفات - التوالف</li>
                <li>لا يشمل الديون والقروض</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">حالة المخزون</h3>
          <p className="text-sm text-gray-500 mb-6">معلومات المنتجات والفئات</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 font-semibold mb-1">📦 إجمالي المنتجات</p>
              <p className="text-2xl font-bold text-blue-700">{totalProducts}</p>
              <p className="text-xs text-gray-500 mt-2">صنف مختلف</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
              <p className="text-xs text-purple-600 font-semibold mb-1">📂 الفئات</p>
              <p className="text-2xl font-bold text-purple-700">{totalCategories}</p>
              <p className="text-xs text-gray-500 mt-2">قسم</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-xl border border-red-200">
              <p className="text-xs text-red-600 font-semibold mb-1">⚠️ منخفض الرصيد</p>
              <p className="text-2xl font-bold text-red-700">{lowStockCount}</p>
              <p className="text-xs text-gray-500 mt-2">منتج</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
              <p className="text-xs text-orange-600 font-semibold mb-1">📅 منتهي الصلاحية</p>
              <p className="text-2xl font-bold text-orange-700">{expiredCount}</p>
              <p className="text-xs text-gray-500 mt-2">منتج</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">📊 أكثر الموردين ديناً</h3>
          <p className="text-sm text-gray-500 mb-6">قائمة الموردين مع أعلى قروض</p>
          {topDebtorSuppliers.length > 0 ? (
            <div className="space-y-2">
              {topDebtorSuppliers.map((supplier, idx) => (
                <div key={supplier.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{supplier.name}</p>
                      <p className="text-xs text-gray-500">هاتف: {supplier.phone || 'لا يوجد'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-700">{formatCurrency(Math.abs(supplier.balance))}</p>
                    <p className="text-xs text-gray-500">قرض</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>✅ لا توجد قروض من الموردين</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">💰 أكثر العملاء ديناً</h3>
          <p className="text-sm text-gray-500 mb-6">قائمة العملاء مع أعلى ديون</p>
          {topDebtorCustomers.length > 0 ? (
            <div className="space-y-2">
              {topDebtorCustomers.map((customer, idx) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">{customer.name}</p>
                      <p className="text-xs text-gray-500">هاتف: {customer.phone || 'لا يوجد'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-700">{formatCurrency(customer.balance)}</p>
                    <p className="text-xs text-gray-500">دين</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>✅ لا توجد ديون للعملاء</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">⏳ فواتير المشتريات المعلقة</h3>
          <p className="text-sm text-gray-500 mb-6">الفواتير التي لم تُرحّل بعد</p>
          {pendingPurchaseInvoices.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pendingPurchaseInvoices.map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200 hover:shadow-md transition-all">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{purchase.id}</p>
                    <p className="text-xs text-gray-500">{purchase.supplierName} - {purchase.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-orange-600">{formatCurrency(purchase.total)}</p>
                    <p className="text-xs text-gray-500">مستحق: {formatCurrency((purchase.total || 0) - (purchase.paidAmount || 0))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>✅ جميع فواتير المشتريات مرحّلة</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-1">⏳ فواتير المبيعات المعلقة</h3>
          <p className="text-sm text-gray-500 mb-6">الفواتير التي لم تُرحّل بعد</p>
          {pendingSalesInvoices.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pendingSalesInvoices.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200 hover:shadow-md transition-all">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{sale.id}</p>
                    <p className="text-xs text-gray-500">{sale.customerName} - {sale.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{formatCurrency(sale.total)}</p>
                    <p className="text-xs text-gray-500">مستحق: {formatCurrency((sale.total || 0) - (sale.paidAmount || 0))}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500">
              <p>✅ جميع فواتير المبيعات مرحّلة</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
