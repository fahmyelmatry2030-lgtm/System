'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import PostActions from '@/components/PostActions';
import { formatCurrency } from '@/lib/currency';

export default function PendingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pending');
      const data = await res.json();
      setItems(data.items || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      await fetchPending();
    };

    load();
  }, [fetchPending]);

  const columns = [
    { header: 'النوع', accessor: 'label' },
    { header: 'الرقم', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'الطرف / البيان', accessor: 'party' },
    {
      header: 'المبلغ',
      render: (row) => row.amount != null ? formatCurrency(row.amount) : '—',
    },
    { header: 'أنشأها', accessor: 'createdByName' },
    {
      header: 'إجراءات',
      render: (row) => (
        <div className="flex gap-2 items-center">
          <PostActions entity={row.entity} record={{ id: row.id, postStatus: 'pending' }} onPosted={fetchPending} />
          <a href={row.href} className="text-blue-500 hover:underline text-sm">عرض</a>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">عمليات بانتظار الترحيل</h1>
          <p className="page-subtitle">مراجعة واعتماد العمليات التي أنشأها المحاسب أو المندوب قبل تطبيقها على المخزون والأرصدة</p>
        </div>
      </div>

      {!loading && items.length === 0 ? (
        <div className="card" style={{ padding: '40px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>لا توجد عمليات بانتظار الترحيل حالياً</p>
        </div>
      ) : loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable
          title={`العمليات المعلقة (${items.length})`}
          columns={columns}
          data={items}
          emptyMessage="لا توجد عمليات معلقة"
        />
      )}
    </AuthGuard>
  );
}
