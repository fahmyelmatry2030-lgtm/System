'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { formatCurrency } from '@/lib/currency';

export default function CustomersStatementPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      setData(json.customers || json.data || json || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    { header: '#', render: (_, index) => index + 1 },
    { header: 'اسم العميل', accessor: 'name' },
    { header: 'رقم الهاتف', accessor: 'phone' },
    {
      header: 'الرصيد',
      accessor: 'balance',
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.balance < 0 ? '#ef4444' : row.balance > 0 ? '#22c55e' : '#6b7280' }}>
          {formatCurrency(Math.abs(row.balance))}
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
          <h1 className="page-title">كشف حساب عملاء</h1>
          <p className="page-subtitle">عرض كشوف حساب جميع العملاء</p>
        </div>
      </div>

      <DataTable
        title="قائمة العملاء"
        columns={columns}
        data={data}
        loading={loading}
      />
    </AuthGuard>
  );
}
