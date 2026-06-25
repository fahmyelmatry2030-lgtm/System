'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';
import { TrendingUp, TrendingDown, DollarSign, Box, AlertTriangle, BarChart2, Users, FileText } from 'lucide-react';

export default function Reports() {
  const [reportType, setReportType] = useState('financial');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [backupLoading, setBackupLoading] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
  }, []);

  const fetchReport = useCallback(async (type) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=${type}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(reportType);
  }, [reportType, fetchReport]);

  const handleBackup = async () => {
    if (!user || !['admin', 'accountant'].includes(user.role)) {
      alert('هذه العملية متاحة للمدير والمحاسب فقط');
      return;
    }
    setBackupLoading(true);
    try {
      const res = await fetch(`/api/backup?role=${user.role}`);
      if (!res.ok) throw new Error('فشل التنزيل');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `erp-backup-${new Date().toISOString().slice(0, 10)}.sqlite`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const renderFinancial = () => {
    if (!data) return null;
    const netProfit = data.netProfit || 0;
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">📊 التقرير المالي والأرباح والخسائر</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">إجمالي المبيعات</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalSales || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">جميع المبالغ المرحّلة</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">إجمالي المشتريات</h3>
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalPurchases || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">إضافة للمخزون</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">المصروفات</h3>
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">المرحّلة من النظام</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">الخسائر</h3>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalDamaged || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">مواد تالفة / منتهية الصلاحية</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">💰 الملخص المالي النهائي</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">الإيرادات (المبيعات)</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalSales || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">المصروفات (تكلفة المبيعات + مصروفات + تالف)</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency((data.cogs || 0) + (data.totalExpenses || 0) + (data.totalDamaged || 0))}</p>
            </div>
            <div className={`rounded-lg p-4 ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <p className="text-sm text-gray-700 mb-1">صافي الربح / الخسارة</p>
              <p className={`text-3xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSales = () => {
    if (!data) return null;
    const columns = [
      { header: 'رقم الفاتورة', accessor: 'id' },
      { header: 'التاريخ', accessor: 'date' },
      { header: 'العميل', accessor: 'customerName' },
      { header: 'المبلغ', accessor: 'total', render: (row) => <span className="font-bold text-green-600">{formatCurrency(row.total)}</span> },
      { header: 'المدفوع', accessor: 'paidamount', render: (row) => formatCurrency(row.paidamount || row.paidAmount || 0) },
      { header: 'المتبقي', accessor: 'total', render: (row) => {
        const remaining = row.total - (row.paidamount || row.paidAmount || 0);
        return <span className={remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600'}>{formatCurrency(remaining)}</span>;
      }},
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">🛒 تقارير المبيعات</h2>
        
        {data.sales && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">عدد الفواتير</h3>
              <p className="text-3xl font-bold text-blue-600">{(data.sales || []).length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي المبيعات</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalSales || 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">المتبقي</h3>
              <p className="text-3xl font-bold text-purple-600">{formatCurrency((data.totalSales || 0) - (data.totalPaid || 0))}</p>
            </div>
          </div>
        )}

        {data.sales && data.sales.length > 0 && (
          <DataTable
            title="تفاصيل الفواتير"
            columns={columns}
            data={data.sales}
            searchable={true}
            emptyMessage="لا توجد فواتير بيع مسجلة"
          />
        )}
      </div>
    );
  };

  const renderPurchases = () => {
    if (!data) return null;
    const columns = [
      { header: 'رقم الفاتورة', accessor: 'id' },
      { header: 'التاريخ', accessor: 'date' },
      { header: 'المورد', accessor: 'suppliername' },
      { header: 'المبلغ', accessor: 'total', render: (row) => <span className="font-bold text-orange-600">{formatCurrency(row.total)}</span> },
      { header: 'المدفوع', accessor: 'paidamount', render: (row) => formatCurrency(row.paidamount || row.paidAmount || 0) },
      { header: 'المتبقي', accessor: 'total', render: (row) => {
        const remaining = row.total - (row.paidamount || row.paidAmount || 0);
        return <span className={remaining > 0 ? 'text-orange-600 font-semibold' : 'text-green-600'}>{formatCurrency(remaining)}</span>;
      }},
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">📦 تقارير المشتريات</h2>
        
        {data.purchases && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">عدد الفواتير</h3>
              <p className="text-3xl font-bold text-blue-600">{(data.purchases || []).length}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي المشتريات</h3>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(data.totalPurchases || 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">المتبقي للدفع</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency((data.totalPurchases || 0) - (data.totalPaid || 0))}</p>
            </div>
          </div>
        )}

        {data.purchases && data.purchases.length > 0 && (
          <DataTable
            title="تفاصيل الفواتير"
            columns={columns}
            data={data.purchases}
            searchable={true}
            emptyMessage="لا توجد فواتير شراء مسجلة"
          />
        )}
      </div>
    );
  };

  const renderInventory = () => {
    if (!data) return null;
    const columns = [
      { header: 'المنتج', accessor: 'name' },
      { header: 'الفئة', accessor: 'category' },
      { header: 'الكمية المتاحة', accessor: 'qty', render: (row) => <strong>{row.qty.toLocaleString()}</strong> },
      { header: 'الحد الأدنى', accessor: 'threshold' },
      {
        header: 'الحالة',
        render: (row) => (
          <span className={row.qty <= row.threshold ? 'bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold' : 'bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold'}>
            {row.qty <= row.threshold ? '⚠️ منخفض' : '✅ كافي'}
          </span>
        ),
      },
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">📦 تقرير المخزون</h2>
        
        {data.lowStock && data.lowStock.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-6 border-2 border-red-300">
            <h3 className="text-lg font-bold text-red-700 mb-2">⚠️ منتجات منخفضة الرصيد</h3>
            <p className="text-sm text-red-600 mb-4">يوجد {data.lowStock.length} منتج يحتاج إلى إعادة طلب</p>
            <DataTable
              title=""
              columns={columns}
              data={data.lowStock || []}
              searchable={true}
              emptyMessage="لا توجد منتجات منخفضة الرصيد"
            />
          </div>
        )}
      </div>
    );
  };

  const renderStocktake = () => {
    if (!data) return null;
    const columns = [
      { header: 'التاريخ', accessor: 'date' },
      { header: 'المنتج', accessor: 'productName' },
      { header: 'المسجل بالنظام', accessor: 'systemQty' },
      { header: 'الفعلي', accessor: 'physicalQty' },
      { header: 'الفرق', accessor: 'difference', render: (row) => <strong className={row.difference >= 0 ? 'text-green-600' : 'text-red-600'}>{row.difference >= 0 ? '+' : ''}{row.difference}</strong> },
      { header: 'الحالة', accessor: 'status', render: (row) => {
        const statusMap = { matching: '✅ مطابق', surplus: '📈 فائض', deficit: '📉 عجز' };
        return <span className="font-semibold">{statusMap[row.status] || row.status}</span>;
      }},
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">🔍 تقارير جرد المخزون</h2>
        
        {data.stocktakes && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">عمليات الجرد</h3>
              <p className="text-3xl font-bold text-blue-600">{(data.stocktakes || []).length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي الفائض</h3>
              <p className="text-3xl font-bold text-green-600">{formatCurrency(data.surplus || 0)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي العجز</h3>
              <p className="text-3xl font-bold text-red-600">{formatCurrency(data.deficit || 0)}</p>
            </div>
          </div>
        )}

        {data.stocktakes && data.stocktakes.length > 0 && (
          <DataTable
            title="تفاصيل عمليات الجرد"
            columns={columns}
            data={data.stocktakes}
            searchable={true}
            emptyMessage="لا توجد عمليات جرد مسجلة"
          />
        )}
      </div>
    );
  };

  const renderDamaged = () => {
    if (!data) return null;
    const columns = [
      { header: 'التاريخ', accessor: 'date' },
      { header: 'المنتج', accessor: 'productName' },
      { header: 'الكمية', accessor: 'qty' },
      { header: 'النوع', accessor: 'type' },
      { header: 'السبب', accessor: 'reason' },
      { header: 'قيمة الخسارة', accessor: 'value', render: (row) => <span className="font-bold text-red-600">{formatCurrency(row.value)}</span> },
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">⚠️ تقارير المواد التالفة والمنتهية الصلاحية</h2>
        
        {data.damaged && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">عدد الحوادث</h3>
              <p className="text-3xl font-bold text-red-600">{(data.damaged || []).length}</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي الخسائر</h3>
              <p className="text-3xl font-bold text-orange-600">{formatCurrency(data.totalLoss || 0)}</p>
            </div>
          </div>
        )}

        {data.damaged && data.damaged.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">سجل المواد التالفة</h3>
            <DataTable
              title=""
              columns={columns}
              data={data.damaged}
              searchable={true}
              emptyMessage="لا توجد مواد تالفة مسجلة"
            />
          </div>
        )}

        {data.expired && data.expired.length > 0 && (
          <div className="bg-yellow-50 rounded-2xl p-6 border-2 border-yellow-300">
            <h3 className="text-lg font-bold text-yellow-700 mb-4">⏰ منتجات منتهية الصلاحية</h3>
            <DataTable
              title=""
              columns={[
                { header: 'المنتج', accessor: 'name' },
                { header: 'تاريخ الانتهاء', accessor: 'expiryDate' },
                { header: 'الكمية', accessor: 'qty' },
              ]}
              data={data.expired}
              searchable={true}
              emptyMessage="لا توجد منتجات منتهية الصلاحية"
            />
          </div>
        )}
      </div>
    );
  };

  const renderCollections = () => {
    if (!data) return null;
    const customerColumns = [
      { header: 'اسم العميل', accessor: 'name' },
      { header: 'المبلغ المدين', accessor: 'balance', render: (row) => <span className="font-bold text-red-600">{formatCurrency(row.balance)}</span> },
    ];
    const collectionColumns = [
      { header: 'التاريخ', accessor: 'date' },
      { header: 'العميل', accessor: 'customerName' },
      { header: 'المبلغ', accessor: 'amount', render: (row) => <span className="font-bold text-green-600">{formatCurrency(row.amount)}</span> },
      { header: 'الطريقة', accessor: 'method', render: (row) => row.method === 'cash' ? '💰 نقدي' : row.method === 'transfer' ? '🏦 حوالة' : '💳 شيك' },
      { header: 'المندوب', accessor: 'repName' },
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-gray-800">💳 تقارير التحصيلات والمديونيات</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي المحصل</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalCollected || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي الديون المستحقة</h3>
            <p className="text-3xl font-bold text-red-600">{formatCurrency(data.totalDebt || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">نسبة التحصيل</h3>
            <p className="text-3xl font-bold text-blue-600">
              {data.totalDebt ? Math.round((data.totalCollected || 0) / data.totalDebt * 100) : 0}%
            </p>
          </div>
        </div>

        {data.customers && data.customers.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">👥 ديون لنا (عملاء)</h3>
            <DataTable
              title=""
              columns={customerColumns}
              data={data.customers}
              searchable={true}
              emptyMessage="لا يوجد عملاء مدينين"
            />
          </div>
        )}

        {data.collections && data.collections.length > 0 && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-4">📋 سندات القبض الأخيرة</h3>
            <DataTable
              title=""
              columns={collectionColumns}
              data={data.collections.slice(0, 50)}
              searchable={true}
              emptyMessage="لا توجد تحصيلات مسجلة"
            />
          </div>
        )}
      </div>
    );
  };

  const reportTabs = [
    { id: 'financial', label: '📊 المالي والأرباح/الخسائر', icon: BarChart2 },
    { id: 'sales', label: '🛒 المبيعات', icon: TrendingUp },
    { id: 'purchases', label: '📦 المشتريات', icon: TrendingDown },
    { id: 'inventory', label: '📚 المخزون', icon: Box },
    { id: 'stocktake', label: '🔍 الجرد', icon: FileText },
    { id: 'damaged', label: '⚠️ التالف/المنتهي', icon: AlertTriangle },
    { id: 'collections', label: '💳 التحصيلات/الديون', icon: DollarSign },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">مركز التقارير الشامل</h1>
          <p className="page-subtitle">تقارير متكاملة تغطي جميع جوانب الأعمال</p>
        </div>
        {user && ['admin', 'accountant'].includes(user.role) && (
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            onClick={handleBackup} 
            disabled={backupLoading}
          >
            {backupLoading ? '⏳ جاري التنزيل...' : '⬇️ نسخة احتياطية'}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-3">
        {reportTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportType(tab.id)}
            className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
              reportType === tab.id 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="animate-slide">
          {reportType === 'financial' && renderFinancial()}
          {reportType === 'sales' && renderSales()}
          {reportType === 'purchases' && renderPurchases()}
          {reportType === 'inventory' && renderInventory()}
          {reportType === 'stocktake' && renderStocktake()}
          {reportType === 'damaged' && renderDamaged()}
          {reportType === 'collections' && renderCollections()}
        </div>
      )}
    </AuthGuard>
  );
}
