'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import PostActions from '@/components/PostActions';
import { formatCurrency } from '@/lib/currency';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function PendingPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

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
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    window.addEventListener('pending-updated', fetchPending);
    return () => {
      clearInterval(interval);
      window.removeEventListener('pending-updated', fetchPending);
    };
  }, [fetchPending]);

  const getTypeColor = (type) => {
    const colors = {
      collections: 'bg-green-100 text-green-700 border-green-300',
      returns: 'bg-blue-100 text-blue-700 border-blue-300',
      expenses: 'bg-orange-100 text-orange-700 border-orange-300',
      damaged: 'bg-red-100 text-red-700 border-red-300',
      stocktakes: 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const filtered = filter === 'all' ? items : items.filter(item => item.entity === filter);
  const grouped = {};
  filtered.forEach(item => {
    if (!grouped[item.entity]) grouped[item.entity] = [];
    grouped[item.entity].push(item);
  });

  const columns = [
    {
      header: 'النوع',
      render: (row) => <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getTypeColor(row.entity)}`}>{row.label}</span>
    },
    { header: 'رقم العملية', accessor: 'id', render: (row) => <span className="font-mono text-blue-600 font-bold">{row.id}</span> },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'الطرف / البيان', accessor: 'party' },
    {
      header: 'المبلغ',
      render: (row) => row.amount != null ? <span className="font-bold text-green-600">{formatCurrency(row.amount)}</span> : '—',
    },
    { header: 'أنشأها', accessor: 'createdByName', render: (row) => <span className="text-sm text-gray-600">{row.createdByName}</span> },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex gap-2 items-center">
          <PostActions entity={row.entity} record={{ id: row.id, postStatus: 'pending' }} onPosted={fetchPending} />
          <a href={row.href} className="text-blue-500 hover:underline text-sm font-semibold">📄 عرض</a>
        </div>
      ),
    },
  ];

  const stats = {
    total: items.length,
    collections: items.filter(i => i.entity === 'collections').length,
    returns: items.filter(i => i.entity === 'returns').length,
    expenses: items.filter(i => i.entity === 'expenses').length,
    damaged: items.filter(i => i.entity === 'damaged').length,
    stocktakes: items.filter(i => i.entity === 'stocktakes').length,
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">⏳ عمليات بانتظار الترحيل</h1>
          <p className="page-subtitle">اعتمد العمليات التي أنشأها المحاسب والمندوب لتطبيقها على النظام</p>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 font-bold text-center transition ${
            filter === 'all' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
          }`}
        >
          <div className="text-2xl">{stats.total}</div>
          <div className="text-xs">الكل</div>
        </button>
        {[
          { key: 'collections', label: '💳 تحصيلات', count: stats.collections },
          { key: 'returns', label: '↩️ مرتجعات', count: stats.returns },
          { key: 'expenses', label: '💰 مصروفات', count: stats.expenses },
          { key: 'damaged', label: '⚠️ تالفة', count: stats.damaged },
          { key: 'stocktakes', label: '📋 جرد', count: stats.stocktakes },
        ].map(stat => (
          <button
            key={stat.key}
            onClick={() => setFilter(stat.key)}
            className={`p-4 rounded-xl border-2 font-bold text-center transition ${
              filter === stat.key ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
            }`}
          >
            <div className="text-2xl">{stat.count}</div>
            <div className="text-xs">{stat.label}</div>
          </button>
        ))}
      </div>

      {!loading && items.length === 0 ? (
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-3xl p-12 text-center border-2 border-green-200">
          <CheckCircle size={64} className="text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-green-700 mb-2">✅ لا توجد عمليات معلقة</h2>
          <p className="text-green-600">جميع العمليات تم اعتمادها بنجاح</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <div className="space-y-4 animate-slide">
          <DataTable
            title={`العمليات المعلقة (${filtered.length})`}
            columns={columns}
            data={filtered}
            searchable={true}
            emptyMessage="لا توجد عمليات في هذا التصنيف"
          />
        </div>
      )}
    </AuthGuard>
  );
}
