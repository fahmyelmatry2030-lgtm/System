'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { formatCurrency } from '@/lib/currency';
import { History, Download } from 'lucide-react';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExport = () => {
    const csv = [
      ['رقم السجل', 'الإجراء', 'نوع العملية', 'رقم السجل', 'المستخدم', 'التاريخ والوقت', 'التفاصيل'].join(','),
      ...logs.map(log =>
        [
          log.id,
          log.action,
          log.entity,
          log.recordId,
          log.userName || 'غير معروف',
          log.timestamp,
          log.details
        ].map(v => `"${v || ''}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getActionColor = (action) => {
    const colors = {
      'ترحيل': 'bg-green-100 text-green-700 border-green-300',
      'إنشاء': 'bg-blue-100 text-blue-700 border-blue-300',
      'تعديل': 'bg-orange-100 text-orange-700 border-orange-300',
      'حذف': 'bg-red-100 text-red-700 border-red-300',
      'عكس': 'bg-purple-100 text-purple-700 border-purple-300',
    };
    return colors[action] || 'bg-gray-100 text-gray-700 border-gray-300';
  };

  const filtered = filter === 'all' ? logs : logs.filter(log => log.action === filter);

  const columns = [
    {
      header: 'الإجراء',
      render: (row) => <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getActionColor(row.action)}`}>{row.action}</span>
    },
    { header: 'نوع العملية', accessor: 'entity' },
    { header: 'رقم السجل', accessor: 'recordId', render: (row) => <span className="font-mono text-blue-600 font-bold">{row.recordId}</span> },
    { header: 'المستخدم', accessor: 'userName' },
    { header: 'التاريخ والوقت', accessor: 'timestamp' },
    { header: 'التفاصيل', accessor: 'details', render: (row) => <span className="text-sm text-gray-600">{row.details}</span> },
  ];

  const stats = {
    total: logs.length,
    posts: logs.filter(l => l.action === 'ترحيل').length,
    creates: logs.filter(l => l.action === 'إنشاء').length,
    edits: logs.filter(l => l.action === 'تعديل').length,
    deletes: logs.filter(l => l.action === 'حذف').length,
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">📋 سجل التدقيق</h1>
          <p className="page-subtitle">متابعة جميع العمليات والترحيلات في النظام</p>
        </div>
        <button
          onClick={handleExport}
          className="btn-secondary flex gap-2"
        >
          <Download size={20} /> تنزيل CSV
        </button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-xl border-2 font-bold text-center transition ${
            filter === 'all' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
          }`}
        >
          <div className="text-2xl">{stats.total}</div>
          <div className="text-xs">الكل</div>
        </button>
        <button
          onClick={() => setFilter('ترحيل')}
          className={`p-4 rounded-xl border-2 font-bold text-center transition ${
            filter === 'ترحيل' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-white border-gray-200 text-gray-600 hover:border-green-200'
          }`}
        >
          <div className="text-2xl">{stats.posts}</div>
          <div className="text-xs">✅ ترحيل</div>
        </button>
        <button
          onClick={() => setFilter('إنشاء')}
          className={`p-4 rounded-xl border-2 font-bold text-center transition ${
            filter === 'إنشاء' ? 'bg-blue-50 border-blue-400 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:border-blue-200'
          }`}
        >
          <div className="text-2xl">{stats.creates}</div>
          <div className="text-xs">➕ إنشاء</div>
        </button>
        <button
          onClick={() => setFilter('تعديل')}
          className={`p-4 rounded-xl border-2 font-bold text-center transition ${
            filter === 'تعديل' ? 'bg-orange-50 border-orange-400 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-200'
          }`}
        >
          <div className="text-2xl">{stats.edits}</div>
          <div className="text-xs">✏️ تعديل</div>
        </button>
        <button
          onClick={() => setFilter('حذف')}
          className={`p-4 rounded-xl border-2 font-bold text-center transition ${
            filter === 'حذف' ? 'bg-red-50 border-red-400 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:border-red-200'
          }`}
        >
          <div className="text-2xl">{stats.deletes}</div>
          <div className="text-xs">🗑️ حذف</div>
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <DataTable
          title={`سجل التدقيق (${filtered.length})`}
          columns={columns}
          data={filtered}
          searchable={true}
          emptyMessage="لا توجد سجلات في هذا التصنيف"
        />
      )}
    </AuthGuard>
  );
}
