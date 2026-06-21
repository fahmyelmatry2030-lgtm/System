'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { formatCurrency } from '@/lib/currency';
import { formatIraqDate } from '@/lib/date-utils';

export default function DebtsPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadDebts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/reports?type=debt');
        if (!res.ok) {
          throw new Error('فشل تحميل البيانات');
        }
        const json = await res.json();
        const customerList = (json.customers || json.data || []).filter(c => (c.balance || 0) > 0);
        setCustomers(customerList);
      } catch (error) {
        console.error(error);
        setError(error.message);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadDebts();
  }, []);

  const totalDebt = customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
  const averageDebt = customers.length > 0 ? totalDebt / customers.length : 0;

  const columns = [
    { header: '#', render: (_, idx) => idx + 1 },
    { header: '👤 اسم العميل', accessor: 'name', render: (row) => row.name || '—' },
    { header: '📱 الهاتف', accessor: 'phone', render: (row) => row.phone || '—' },
    {
      header: '💰 المديونية',
      accessor: 'balance',
      render: (row) => {
        const debt = row.balance || 0;
        return (
          <div className="text-center">
            <span className={`font-bold text-lg ${debt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(debt)}
            </span>
          </div>
        );
      },
    },
    {
      header: '⚙️ الإجراءات',
      render: (row) => (
        <a 
          href={`/customers/${row.id}`} 
          className="text-blue-600 hover:text-blue-800 transition-colors font-semibold hover:underline"
        >
          📄 كشف حساب
        </a>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">💳 ديون العملاء</h1>
          <p className="page-subtitle">عرض العملاء الذين لديهم رصيد مدين في النظام</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border-2 border-red-500 text-red-700 px-4 py-3 rounded-lg mb-4">
          <p className="font-semibold">⚠️ خطأ في التحميل</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-6 shadow-sm border-2 border-red-200">
          <h3 className="text-sm text-gray-600 font-semibold mb-2">👥 عدد العملاء المدينين</h3>
          <p className="text-3xl font-bold text-red-700">{customers.length}</p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-6 shadow-sm border-2 border-orange-200">
          <h3 className="text-sm text-gray-600 font-semibold mb-2">📊 متوسط الدين</h3>
          <p className="text-lg font-bold text-orange-700">{formatCurrency(averageDebt)}</p>
        </div>
        <div className="bg-gradient-to-br from-red-100 to-red-200 rounded-lg p-6 shadow-sm border-2 border-red-400">
          <h3 className="text-sm text-gray-700 font-semibold mb-2">💸 إجمالي الديون</h3>
          <p className="text-3xl font-bold text-red-700">{formatCurrency(totalDebt)}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg">✅ لا يوجد عملاء لديهم مديونية حالياً</p>
          <p className="text-gray-500 text-sm mt-2">جميع العملاء محدثوا السداد ✨</p>
        </div>
      ) : (
        <DataTable
          title="📊 قائمة العملاء بالمديونية"
          columns={columns}
          data={customers}
          emptyMessage="📭 لا توجد ديون مسجلة"
        />
      )}
    </AuthGuard>
  );
}
