'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { formatCurrency } from '@/lib/currency';

export default function DebtsPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDebts = async () => {
      try {
        const res = await fetch('/api/reports?type=debt');
        const json = await res.json();
        setCustomers(json.customers || []);
      } catch (error) {
        console.error(error);
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };

    loadDebts();
  }, []);

  const totalDebt = customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);

  const columns = [
    { header: 'اسم العميل', accessor: 'name' },
    { header: 'الهاتف', accessor: 'phone' },
    {
      header: 'المديونية',
      accessor: 'balance',
      render: (row) => (
        <span className={row.balance > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}>
          {formatCurrency(row.balance)}
        </span>
      ),
    },
    {
      header: 'إجراءات',
      render: (row) => (
        <a href={`/customers/${row.id}`} className="text-blue-600 hover:underline">
          عرض كشف الحساب
        </a>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">ديون العملاء</h1>
          <p className="page-subtitle">عرض العملاء الذين لديهم رصيد مدين في النظام.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm text-gray-500 mb-2">عدد العملاء المدينين</h3>
          <p className="text-3xl font-bold text-red-600">{customers.length}</p>
        </div>
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 md:col-span-2">
          <h3 className="text-sm text-gray-500 mb-2">إجمالي قيمة الديون</h3>
          <p className="text-3xl font-bold text-red-600">{formatCurrency(totalDebt)}</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable
          title="قائمة العملاء بالمديونية"
          columns={columns}
          data={customers}
          emptyMessage="لا يوجد عملاء لديهم مديونية حالياً"
        />
      )}
    </AuthGuard>
  );
}
