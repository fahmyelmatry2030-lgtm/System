'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import { formatCurrency } from '@/lib/currency';
import PrintInvoice from '@/components/PrintInvoice'; // Reusing styles but creating a specific print layout here if needed.

export default function CustomerStatementPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/customers/statement?customerId=${id}`);
        const result = await res.json();
        setData(result);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;
  if (!data?.customer) return <div className="text-center mt-20 text-red-500">العميل غير موجود</div>;
  if (!data?.sales && !data?.collections) {
    data.sales = [];
    data.collections = [];
  }

  // Aggregate and sort timeline
  const timeline = [];
  data.sales.forEach(sale => {
    timeline.push({
      date: new Date(sale.date || sale.createdat),
      type: 'sale',
      label: 'فاتورة مبيعات #' + sale.id,
      debit: sale.total,
      credit: sale.paidamount,
      notes: sale.notes
    });
  });
  data.collections.forEach(coll => {
    timeline.push({
      date: new Date(coll.date || coll.createdat),
      type: 'collection',
      label: 'سند قبض #' + coll.id,
      debit: 0,
      credit: coll.amount,
      notes: coll.notes
    });
  });

  timeline.sort((a, b) => a.date - b.date);

  let runningBalance = 0;

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="flex justify-between items-center mb-6 print-hide">
        <div>
          <h1 className="text-2xl font-bold">كشف حساب عميل</h1>
          <p className="text-gray-500">تفاصيل الحركات المالية والرصيد</p>
        </div>
        <button onClick={handlePrint} className="btn btn-primary">🖨️ طباعة كشف الحساب</button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 print-container" id="statement-print">
        <div className="text-center mb-8 border-b border-gray-200 pb-6">
          <h2 className="text-2xl font-bold text-gray-800">كشف حساب</h2>
          <p className="text-gray-500 mt-1">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
        </div>

        <div className="flex justify-between mb-8 bg-gray-50 p-6 rounded-2xl">
          <div>
            <p className="text-sm text-gray-500 mb-1">اسم العميل</p>
            <p className="text-xl font-bold text-blue-600">{data.customer.name}</p>
            <p className="text-sm text-gray-500 mt-2">الهاتف: <span className="font-bold text-gray-800">{data.customer.phone || 'غير مسجل'}</span></p>
          </div>
          <div className="text-left">
            <p className="text-sm text-gray-500 mb-1">الرصيد الحالي المستحق</p>
            <p className={`text-3xl font-bold ${data.customer.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(data.customer.balance)}
            </p>
          </div>
        </div>

        <table className="w-full text-right border-collapse text-sm">
          <thead>
            <tr className="bg-gray-800 text-white">
              <th className="p-3 rounded-tr-lg">التاريخ</th>
              <th className="p-3">البيان</th>
              <th className="p-3">ملاحظات</th>
              <th className="p-3 text-red-300">مدين (عليه)</th>
              <th className="p-3 text-green-300">دائن (له)</th>
              <th className="p-3 rounded-tl-lg">الرصيد التراكمي</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100 bg-gray-50">
              <td className="p-3" colSpan="5"><strong>رصيد افتتاحي / سابق</strong></td>
              <td className="p-3 font-bold text-gray-700">{formatCurrency(0)}</td>
            </tr>
            {timeline.map((item, idx) => {
              runningBalance += (item.debit - item.credit);
              return (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-3 text-gray-600">{item.date.toLocaleDateString('en-GB')}</td>
                  <td className="p-3 font-semibold text-gray-800">{item.label}</td>
                  <td className="p-3 text-gray-500">{item.notes || '-'}</td>
                  <td className="p-3 text-red-600 font-bold">{item.debit > 0 ? formatCurrency(item.debit) : '-'}</td>
                  <td className="p-3 text-green-600 font-bold">{item.credit > 0 ? formatCurrency(item.credit) : '-'}</td>
                  <td className="p-3 font-bold bg-gray-50 text-blue-600">{formatCurrency(runningBalance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 flex justify-end">
          <div className="bg-gray-50 p-6 rounded-2xl w-80 border border-gray-200">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">إجمالي المدين:</span>
              <span className="font-bold text-red-600">{formatCurrency(timeline.reduce((s, i) => s + i.debit, 0))}</span>
            </div>
            <div className="flex justify-between mb-4 pb-4 border-b border-gray-200">
              <span className="text-gray-600">إجمالي الدائن (المدفوع):</span>
              <span className="font-bold text-green-600">{formatCurrency(timeline.reduce((s, i) => s + i.credit, 0))}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>الرصيد النهائي:</span>
              <span className={runningBalance > 0 ? 'text-red-600' : 'text-green-600'}>{formatCurrency(runningBalance)}</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          .print-hide { display: none !important; }
          #statement-print, #statement-print * { visibility: visible; }
          #statement-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none;
          }
        }
      `}</style>
    </AuthGuard>
  );
}
