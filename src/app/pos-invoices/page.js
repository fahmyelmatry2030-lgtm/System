'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import { formatCurrency } from '@/lib/currency';
import { formatIraqDate } from '@/lib/date-utils';

export default function POSInvoicesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/sales');
      const json = await res.json();
      setData((json.sales || json.data || json || []).filter(s => s.notes?.includes('POS') || s.paymentMethod));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem('erp_user') || '{}'));
    fetchData();
  }, []);

  const handlePrint = (invoice) => {
    const printWindow = window.open('', '', 'width=900,height=700');
    const items = invoice.items || [];
    const itemsHTML = items.map((item, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px;">${idx + 1}</td>
        <td style="text-align: right; padding: 8px;">${item.productName}</td>
        <td style="text-align: center; padding: 8px;">${formatCurrency(item.price)}</td>
        <td style="text-align: center; padding: 8px;">${item.qty}</td>
        <td style="text-align: center; padding: 8px;">${formatCurrency((item.price || 0) * (item.qty || 0))}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <meta charset="utf-8">
          <title>فاتورة الكاشير #${invoice.id}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; direction: rtl; background: white; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 15px; border-bottom: 3px solid #333; padding-bottom: 10px; }
            .header h1 { margin: 0; font-size: 22px; color: #333; }
            .header p { margin: 3px 0; font-size: 13px; color: #666; }
            .customer-info { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 5px; }
            .info-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 13px; }
            .info-row strong { color: #333; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th { background-color: #333; color: white; padding: 10px; text-align: right; font-size: 12px; border: 1px solid #333; }
            td { padding: 8px; border: 1px solid #ddd; font-size: 12px; }
            .summary { margin-top: 15px; padding: 10px; background: #f9f9f9; border-radius: 5px; }
            .summary-row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 13px; }
            .summary-row.total { border-top: 2px solid #333; padding-top: 8px; font-weight: bold; font-size: 15px; color: #333; }
            .payment-method { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 13px; }
            .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px solid #ddd; font-size: 11px; color: #666; }
            .status { display: inline-block; padding: 4px 10px; border-radius: 3px; font-weight: bold; margin-top: 5px; }
            .status.cash { background: #c7f0d8; color: #165b33; }
            .status.credit { background: #bfdbfe; color: #1e40af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🛒 فاتورة الكاشير (POS)</h1>
              <p>رقم الفاتورة: <strong>${invoice.id}</strong></p>
              <p>التاريخ: <strong>${formatIraqDate(invoice.date)}</strong></p>
            </div>

            <div class="customer-info">
              <div class="info-row">
                <span><strong>👤 العميل:</strong></span>
                <span>${invoice.customerName}</span>
              </div>
              <div class="info-row">
                <span><strong>📱 الهاتف:</strong></span>
                <span>${invoice.customerPhone || 'غير متوفر'}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 50px;">تسلسل</th>
                  <th style="width: 200px;">اسم المنتج</th>
                  <th style="width: 80px;">السعر</th>
                  <th style="width: 60px;">الكمية</th>
                  <th style="width: 100px;">الإجمالي</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>

            <div class="summary">
              <div class="summary-row">
                <span>المجموع الفرعي:</span>
                <span>${formatCurrency((invoice.total || 0) + (invoice.discount || 0))}</span>
              </div>
              ${invoice.discount ? `
              <div class="summary-row">
                <span>الخصم:</span>
                <span>- ${formatCurrency(invoice.discount)}</span>
              </div>
              ` : ''}
              <div class="summary-row total">
                <span>الإجمالي النهائي:</span>
                <span>${formatCurrency(invoice.total || 0)}</span>
              </div>
              <div class="summary-row">
                <span>المدفوع:</span>
                <span>${formatCurrency(invoice.paidAmount || 0)}</span>
              </div>
              <div class="summary-row">
                <span>المتبقي:</span>
                <span>${formatCurrency(Math.max(0, (invoice.total || 0) - (invoice.paidAmount || 0)))}</span>
              </div>

              <div class="payment-method">
                <span><strong>طريقة الدفع:</strong></span>
                <span class="status ${invoice.paymentMethod === 'cash' ? 'cash' : 'credit'}">
                  ${invoice.paymentMethod === 'cash' ? '💰 نقدي' : '📝 قرض'}
                </span>
              </div>
            </div>

            <div class="footer">
              <p>شكراً لك على تعاملك معنا ✨</p>
              <p style="margin-top: 10px;">تم الطباعة: ${new Date().toLocaleString('ar-IQ')}</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  const handleDelete = async (id) => {
    if (confirm('⚠️ هل أنت متأكد من حذف هذه الفاتورة؟')) {
      try {
        await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error(err);
        alert('حدث خطأ في الحذف');
      }
    }
  };

  const columns = [
    { header: '#', render: (_, index) => index + 1 },
    { header: 'رقم الفاتورة', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date', render: (row) => formatIraqDate(row.date) },
    { header: 'العميل', accessor: 'customerName' },
    { header: 'الهاتف', accessor: 'customerPhone', render: (row) => row.customerPhone || '-' },
    {
      header: 'الإجمالي',
      accessor: 'total',
      render: (row) => <span className="font-bold text-blue-600">{formatCurrency(row.total)}</span>,
    },
    {
      header: 'المدفوع',
      accessor: 'paidAmount',
      render: (row) => <span className="font-semibold">{formatCurrency(row.paidAmount || 0)}</span>,
    },
    {
      header: 'حالة الدفع',
      accessor: 'paymentStatus',
      render: (row) => {
        const statusMap = {
          'paid': { text: '✅ مدفوع', color: 'text-green-600' },
          'partial': { text: '⏳ جزئي', color: 'text-blue-600' },
          'unpaid': { text: '❌ معلق', color: 'text-red-600' }
        };
        const status = statusMap[row.paymentStatus] || statusMap['unpaid'];
        return <span className={`font-bold ${status.color}`}>{status.text}</span>;
      }
    },
    {
      header: 'الطريقة',
      accessor: 'paymentMethod',
      render: (row) => row.paymentMethod === 'cash' ? '💰 نقدي' : '📝 قرض',
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handlePrint(row)}
            className="text-green-600 hover:underline font-semibold"
            title="طباعة الفاتورة"
          >
            🖨️ طبع
          </button>
          <button
            onClick={() => handleDelete(row.id)}
            className={`transition-all ${user?.role === 'admin' ? 'text-red-600 hover:underline cursor-pointer' : 'text-gray-400 cursor-not-allowed opacity-50'}`}
            disabled={user?.role !== 'admin'}
            title={user?.role === 'admin' ? 'حذف الفاتورة' : 'لا توجد صلاحية'}
          >
            حذف
          </button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">🛒 فواتير الكاشير (POS)</h1>
          <p className="page-subtitle">عرض وإدارة جميع فواتير نقطة البيع مع خيارات الطباعة والحذف</p>
        </div>
      </div>

      <DataTable
        title="قائمة فواتير الكاشير"
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage={data.length === 0 ? '📭 لا توجد فواتير كاشير حتى الآن' : undefined}
      />
    </AuthGuard>
  );
}
