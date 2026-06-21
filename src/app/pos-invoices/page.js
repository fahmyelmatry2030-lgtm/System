'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { formatCurrency } from '@/lib/currency';
import PrintInvoice from '@/components/PrintInvoice';

export default function POSInvoicesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/sales');
      const json = await res.json();
      setData(json.sales || json.data || json || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = (invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
  const isRep = user.role === 'rep';

  const columns = [
    { header: '#', render: (_, index) => index + 1 },
    { header: 'رقم الفاتورة', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'اسم العميل', accessor: 'customerName' },
    {
      header: 'الإجمالي',
      accessor: 'total',
      render: (row) => formatCurrency(row.total),
    },
    {
      header: 'المدفوع',
      accessor: 'paidAmount',
      render: (row) => formatCurrency(row.paidAmount || 0),
    },
    {
      header: 'طريقة الدفع',
      accessor: 'paymentMethod',
      render: (row) => (row.paymentMethod === 'credit' ? 'قرض' : 'نقدي'),
    },
    {
      header: 'الترحيل',
      accessor: 'postStatus',
      render: (row) => {
        const status = row.postStatus || row.poststatus;
        return status === 'posted' ? 'مرحّل' : 'معلق';
      },
    },
    {
      header: 'إجراءات',
      render: (row) => {
        const isPosted = (row.postStatus || row.poststatus) === 'posted';
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePrint(row)}
              className="text-blue-500 hover:underline"
            >
              طباعة
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className={isPosted || isRep ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:underline'}
              disabled={isPosted || isRep}
            >
              حذف
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">فواتير الكاشير</h1>
          <p className="page-subtitle">عرض وإدارة فواتير نقطة البيع</p>
        </div>
      </div>

      <DataTable
        title="قائمة فواتير الكاشير"
        columns={columns}
        data={data}
        loading={loading}
      />

      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">طباعة الفاتورة</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <PrintInvoice record={selectedInvoice} type="sales" />
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
