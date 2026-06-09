'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { exportToExcel } from '@/lib/export';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';
import { BarChart3, Box, DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react';

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
    const netProfit = (data.totalSales || 0) - (data.totalPurchases || 0) - (data.totalExpenses || 0) - (data.totalDamaged || 0);
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">التقرير المالي الشامل</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">إجمالي المبيعات</h3>
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalSales || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">المبالغ المرحّلة</p>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">إجمالي المشتريات</h3>
              <TrendingDown className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.totalPurchases || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">المبالغ المرحّلة</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">المصروفات</h3>
              <DollarSign className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalExpenses || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">المرحّلة</p>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">الخسائر (تالف)</h3>
              <TrendingDown className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(data.totalDamaged || 0)}</p>
            <p className="text-xs text-gray-600 mt-1">المرحّلة</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-2">صافي الربح / الخسارة</h3>
          <p className={`text-5xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netProfit >= 0 ? '+' : ''}{formatCurrency(netProfit)}
          </p>
          <p className="text-xs text-gray-500 mt-3">= المبيعات - المشتريات - المصروفات - الخسائر</p>
        </div>
      </div>
    );
  };

  const renderInventory = () => {
    if (!data) return null;
    const columns = [
      { header: 'المنتج', accessor: 'name' },
      { header: 'الفئة', accessor: 'category' },
      { header: 'الكمية', accessor: 'qty', render: (row) => row.qty.toLocaleString() },
      { header: 'الرصيد', accessor: 'threshold' },
      {
        header: 'الحالة',
        render: (row) => (
          <span className={row.qty <= row.threshold ? 'bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold' : 'bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold'}>
            {row.qty <= row.threshold ? '⚠️ منخفض' : '✓ كافي'}
          </span>
        ),
      },
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">تقرير المخزون</h2>
        
        {data.lowStock && data.lowStock.length > 0 && (
          <div className="bg-red-50 rounded-2xl p-6 border border-red-200">
            <h3 className="text-lg font-bold text-red-700 mb-2">⚠️ منتجات منخفضة الرصيد</h3>
            <p className="text-sm text-red-600 mb-4">هذه المنتجات تحتاج إلى إعادة طلب</p>
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

  const renderDebt = () => {
    if (!data) return null;
    const customersColumns = [
      { header: 'اسم العميل', accessor: 'name' },
      { header: 'المبلغ المدين', accessor: 'balance', render: (row) => <span className="font-bold text-red-600">{formatCurrency(row.balance)}</span> },
    ];
    const suppliersColumns = [
      { header: 'اسم المورد', accessor: 'name' },
      { header: 'المبلغ المستحق', accessor: 'balance', render: (row) => <span className="font-bold text-orange-600">{formatCurrency(row.balance)}</span> },
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">تقرير الديون والأرصدة</h2>
        
        {data.customers && data.customers.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ديون لنا (عملاء)</h3>
            <p className="text-sm text-gray-600 mb-4">إجمالي الديون: <strong className="text-red-600">{formatCurrency(data.customers.reduce((sum, c) => sum + c.balance, 0))}</strong></p>
            <DataTable
              title=""
              columns={customersColumns}
              data={data.customers}
              searchable={true}
              emptyMessage="لا يوجد عملاء مدينين"
            />
          </div>
        )}

        {data.suppliers && data.suppliers.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ديون علينا (موردين)</h3>
            <p className="text-sm text-gray-600 mb-4">إجمالي الديون: <strong className="text-orange-600">{formatCurrency(data.suppliers.reduce((sum, s) => sum + s.balance, 0))}</strong></p>
            <DataTable
              title=""
              columns={suppliersColumns}
              data={data.suppliers}
              searchable={true}
              emptyMessage="لا يوجد موردين مدينين"
            />
          </div>
        )}
      </div>
    );
  };

  const renderCollections = () => {
    if (!data) return null;
    const columns = [
      { header: 'التاريخ', accessor: 'date' },
      { header: 'العميل', accessor: 'customerName' },
      { header: 'المبلغ', accessor: 'amount', render: (row) => <span className="font-bold text-green-600">{formatCurrency(row.amount)}</span> },
      { header: 'الطريقة', accessor: 'method', render: (row) => row.method === 'cash' ? 'نقدي' : row.method === 'transfer' ? 'حوالة' : 'شيك' },
      { header: 'المندوب', accessor: 'repName' },
    ];
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">تقرير التحصيلات</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي المحصل</h3>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(data.totalCollected || 0)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-1">إجمالي الديون المستحقة</h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(data.totalDebt || 0)}</p>
          </div>
        </div>

        {data.collections && data.collections.length > 0 && (
          <DataTable
            title="سندات القبض الأخيرة"
            columns={columns}
            data={data.collections}
            searchable={true}
            emptyMessage="لا توجد تحصيلات مسجلة"
          />
        )}
      </div>
    );
  };

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">مركز التقارير</h1>
          <p className="page-subtitle">تقارير مالية ومخزنية مفصلة وسهلة الفهم</p>
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

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setReportType('financial')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
            reportType === 'financial' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          📊 التقرير المالي
        </button>
        <button
          onClick={() => setReportType('inventory')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
            reportType === 'inventory' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Box className="inline w-4 h-4 ml-1" /> المخزون
        </button>
        <button
          onClick={() => setReportType('debt')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
            reportType === 'debt' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Users className="inline w-4 h-4 ml-1" /> الديون
        </button>
        <button
          onClick={() => setReportType('collections')}
          className={`px-4 py-2 rounded-lg font-semibold whitespace-nowrap transition ${
            reportType === 'collections' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <DollarSign className="inline w-4 h-4 ml-1" /> التحصيلات
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="animate-slide">
          {reportType === 'financial' && renderFinancial()}
          {reportType === 'inventory' && renderInventory()}
          {reportType === 'debt' && renderDebt()}
          {reportType === 'collections' && renderCollections()}
        </div>
      )}
    </AuthGuard>
  );
}
