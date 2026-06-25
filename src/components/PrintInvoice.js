import React from 'react';
import { formatCurrency } from '@/lib/currency';

export default function PrintInvoice({ record, type = 'sales', settings }) {
  if (!record) return null;

  const isSale = type === 'sales';
  const title = isSale ? 'فاتورة مبيعات' : 'فاتورة مشتريات';
  const entityName = isSale ? record.customerName : record.supplierName;
  const entityLabel = isSale ? 'العميل' : 'المورد';
  
  const companyName = settings?.companyName || 'اسم الشركة';
  const taxRate = settings?.taxRate || 0;
  const logoUrl = settings?.logoUrl || '';
  const footerMessage = settings?.footerMessage || 'شكراً لتعاملكم معنا';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container bg-white p-8 max-w-3xl mx-auto rounded-xl shadow-lg my-4 relative" id={`print-invoice-${record.id}`}>
      
      {/* Hide this button when printing */}
      <div className="absolute top-4 left-4 print-hide">
        <button onClick={handlePrint} className="btn btn-primary shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          طباعة الفاتورة
        </button>
      </div>

      <div className="text-center mb-8 border-b-2 border-gray-200 pb-6">
        {logoUrl && <img src={logoUrl} alt="Logo" className="h-20 mx-auto mb-4 object-contain" />}
        <h1 className="text-3xl font-bold text-gray-800">{companyName}</h1>
        <h2 className="text-xl text-gray-500 mt-2">{title}</h2>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row justify-between mb-8">
        <div className="space-y-2">
          <p className="text-gray-600">رقم الفاتورة: <span className="font-bold text-gray-900">{record.id}</span></p>
          <p className="text-gray-600">التاريخ: <span className="font-bold text-gray-900">{record.date}</span></p>
          <p className="text-gray-600">البائع/المندوب: <span className="font-bold text-gray-900">{record.repName || 'غير محدد'}</span></p>
          <p className="text-gray-600">الهاتف: <span className="font-bold text-gray-900">{record.customerPhone || 'غير متوفر'}</span></p>
          <p className="text-gray-600">طريقة الدفع: <span className="font-bold text-gray-900">{record.paymentMethod === 'credit' ? 'قرض' : 'نقدي'}</span></p>
        </div>
        <div className="text-left bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600 mb-1">{entityLabel}:</p>
          <p className="text-lg font-bold text-blue-600">{entityName}</p>
        </div>
      </div>

      <table className="w-full mb-8 text-right border-collapse">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="p-3 border border-gray-200 rounded-tr-lg">#</th>
            <th className="p-3 border border-gray-200">المنتج</th>
            <th className="p-3 border border-gray-200">الكمية</th>
            <th className="p-3 border border-gray-200">سعر الوحدة</th>
            <th className="p-3 border border-gray-200 rounded-tl-lg">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          {record.items && record.items.map((item, idx) => (
            <tr key={idx} className="border-b border-gray-100">
              <td className="p-3 border-x border-gray-200 text-center">{idx + 1}</td>
              <td className="p-3 border-x border-gray-200">{item.productName}</td>
              <td className="p-3 border-x border-gray-200 text-center">{item.qty}</td>
              <td className="p-3 border-x border-gray-200">{formatCurrency(item.price)}</td>
              <td className="p-3 border-x border-gray-200 font-bold bg-gray-50">{formatCurrency(item.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mb-8">
        <div className="w-64 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <div className="flex justify-between mb-2 text-gray-600">
            <span>المجموع الفرعي:</span>
            <span>{formatCurrency((record.total || 0) + (record.discount || 0))}</span>
          </div>
          {record.discount ? (
            <div className="flex justify-between mb-2 text-orange-600">
              <span>الخصم:</span>
              <span>- {formatCurrency(record.discount)}</span>
            </div>
          ) : null}
          {taxRate > 0 && (
            <div className="flex justify-between mb-2 text-gray-600">
              <span>ضريبة القيمة المضافة ({taxRate}%):</span>
              <span>{formatCurrency((record.total || 0) * (taxRate / 100))}</span>
            </div>
          )}
          <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-xl text-blue-600">
            <span>الإجمالي النهائي:</span>
            <span>{formatCurrency((record.total || 0) + ((record.total || 0) * (taxRate / 100)))}</span>
          </div>
          <div className="flex justify-between mt-4 text-sm text-gray-500">
            <span>المدفوع:</span>
            <span className="text-green-600 font-bold">{formatCurrency(record.paidAmount || 0)}</span>
          </div>
          <div className="flex justify-between mt-1 text-sm text-gray-500">
            <span>المتبقي:</span>
            <span className="text-red-500 font-bold">{formatCurrency(record.total - (record.paidAmount || 0))}</span>
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-500">
            <span>السداد:</span>
            <span className="font-semibold text-gray-900">{record.paymentMethod === 'credit' ? 'قرض' : 'نقدي'}</span>
          </div>
        </div>
      </div>

      <div className="text-center text-gray-500 text-sm mt-12 pt-4 border-t border-gray-200">
        <p>{footerMessage}</p>
      </div>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-hide {
            display: none !important;
          }
          #print-invoice-${record.id}, #print-invoice-${record.id} * {
            visibility: visible;
          }
          #print-invoice-${record.id} {
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
    </div>
  );
}
