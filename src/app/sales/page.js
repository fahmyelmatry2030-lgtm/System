'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';
import { formatIraqDate, getIraqDateISO } from '@/lib/date-utils';
import { Plus, Trash2, Edit, Printer } from 'lucide-react';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [printingInvoice, setPrintingInvoice] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerError, setCustomerError] = useState('');
  const [itemsError, setItemsError] = useState('');
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    date: getIraqDateISO(),
    items: [],
    paymentStatus: 'unpaid',
    partialAmount: 0,
  });

  useEffect(() => {
    setUser(getStoredUser());
    fetchSales();
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sales');
      const data = await res.json();
      setSales(data.sales || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 0)), 0);
  };

  const calculateRemaining = () => {
    const total = calculateTotal();
    const paid = formData.paymentStatus === 'partial' ? (formData.partialAmount || 0) : (formData.paymentStatus === 'paid' ? total : 0);
    return Math.max(0, total - paid);
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', productName: '', qty: 1, price: 0 }],
    });
  };

  const handleRemoveItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const handleUpdateItem = (index, field, value) => {
    const items = [...formData.items];
    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        items[index] = {
          ...items[index],
          productId: value,
          productName: product.name,
          price: product.sellPrice || 0,
        };
      }
    } else {
      items[index][field] = field === 'qty' ? parseInt(value) || 1 : parseFloat(value) || 0;
    }
    setFormData({ ...formData, items });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // التحقق من العميل
    if (!formData.customerName?.trim()) {
      setCustomerError('⚠️ يرجى إدخال اسم العميل');
      return;
    }
    setCustomerError('');

    // التحقق من المواد
    if (formData.items.length === 0) {
      setItemsError('⚠️ يرجى إضافة مادة واحدة على الأقل');
      return;
    }
    setItemsError('');

    try {
      const total = calculateTotal();
      const paidAmount = formData.paymentStatus === 'partial' 
        ? (formData.partialAmount || 0) 
        : (formData.paymentStatus === 'paid' ? total : 0);

      const payload = {
        customerId: formData.customerId,
        customerName: formData.customerName,
        date: formData.date,
        items: formData.items,
        total,
        paidAmount,
        paymentStatus: formData.paymentStatus,
        postStatus: 'pending', // يبقى معلق لحين ترحيل المدير
        notes: 'تم الإنشاء من نقطة البيع'
      };

      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch('/api/sales', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { ...payload, id: editingId } : payload),
      });

      if (!res.ok) throw new Error('خطأ في الحفظ');
      
      fetchSales();
      setShowModal(false);
      resetForm();
      alert('✅ تم حفظ الفاتورة بنجاح! (بانتظار الترحيل)');
    } catch (err) {
      alert('❌ خطأ: ' + err.message);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      customerId: '',
      customerName: '',
      date: getIraqDateISO(),
      items: [],
      paymentStatus: 'unpaid',
      partialAmount: 0,
    });
    setCustomerError('');
    setItemsError('');
  };

  const handleDelete = async (id) => {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذه الفاتورة؟')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('خطأ في الحذف');
      fetchSales();
      alert('✅ تم الحذف بنجاح');
    } catch (err) {
      alert('❌ خطأ: ' + err.message);
    }
  };

  const handleEdit = (sale) => {
    setEditingId(sale.id);
    setFormData({
      customerId: sale.customerId || '',
      customerName: sale.customerName,
      date: sale.date,
      items: sale.items || [],
      paymentStatus: sale.paymentStatus || 'unpaid',
      partialAmount: sale.paidAmount || 0,
    });
    setShowModal(true);
  };

  const handlePrint = (sale) => {
    setPrintingInvoice(sale);
  };

  const columns = [
    { header: '#', render: (_, idx) => idx + 1 },
    { header: 'رقم الفاتورة', accessor: 'id', render: (row) => <span className="font-bold text-blue-600">#{row.id}</span> },
    { header: 'التاريخ', accessor: 'date', render: (row) => formatIraqDate(row.date) },
    { header: 'اسم العميل', accessor: 'customerName' },
    { header: 'المجموع', accessor: 'total', render: (row) => <span className="font-bold text-blue-600">{formatCurrency(row.total)}</span> },
    { 
      header: 'المدفوع', 
      accessor: 'paidAmount', 
      render: (row) => formatCurrency(row.paidAmount || 0) 
    },
    {
      header: 'المتبقي',
      render: (row) => {
        const remaining = (row.total || 0) - (row.paidAmount || 0);
        return <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-gray-700'}`}>{formatCurrency(remaining)}</span>;
      }
    },
    {
      header: 'حالة الدفع',
      render: (row) => {
        const remaining = (row.total || 0) - (row.paidAmount || 0);
        if (remaining === 0) {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">✅ مدفوع</span>;
        } else if ((row.paidAmount || 0) > 0) {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">⏳ جزئي</span>;
        } else {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700">❌ معلق</span>;
        }
      }
    },
    {
      header: 'حالة الترحيل',
      render: (row) => {
        if (row.postStatus === 'posted') {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700">✅ مرحل</span>;
        } else {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700">⏳ معلق</span>;
        }
      }
    },
    {
      header: 'الإجراءات',
      render: (row) => {
        const isPosted = row.postStatus === 'posted';
        const isAccountant = user?.role === 'accountant';
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(row)}
              className={`transition-all ${
                isPosted 
                  ? 'text-gray-300 cursor-not-allowed opacity-50' 
                  : 'text-orange-600 hover:text-orange-700 cursor-pointer'
              }`}
              disabled={isPosted}
              title={isPosted ? 'لا يمكن تعديل فاتورة مرحلة' : 'تعديل'}
            >
              ✏️ تعديل
            </button>
            <button
              onClick={() => handlePrint(row)}
              className="text-green-600 hover:text-green-700 cursor-pointer"
              title="طباعة الفاتورة"
            >
              🖨️ طبع
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className={`transition-all ${
                isPosted 
                  ? 'text-gray-300 cursor-not-allowed opacity-50' 
                  : 'text-red-600 hover:text-red-700 cursor-pointer'
              }`}
              disabled={isPosted}
              title={isPosted ? 'لا يمكن حذف فاتورة مرحلة' : 'حذف'}
            >
              🗑️ حذف
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">� فواتير المبيعات</h1>
          <p className="page-subtitle">إدارة فواتير البيع مع تفاصيل المنتجات والعملاء</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus size={20} /> فاتورة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <DataTable
          title="📊 قائمة الفواتير"
          columns={columns}
          data={sales}
          emptyMessage="📭 لا توجد فواتير بيع حتى الآن"
        />
      )}

      {/* Modal للإنشاء والتعديل */}
      <Modal isOpen={showModal && !printingInvoice} title={editingId ? '✏️ تعديل الفاتورة' : '➕ فاتورة جديدة'} onClose={() => { setShowModal(false); resetForm(); }}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اختيار العميل */}
          <div>
            <label className="form-label">اسم العميل 👤</label>
            <input
              type="text"
              placeholder="اكتب اسم العميل أو اختره من القائمة"
              value={formData.customerName}
              onChange={(e) => {
                setFormData({ ...formData, customerName: e.target.value });
                setCustomerError('');
              }}
              list="customers-list"
              className={`form-input border-2 transition-colors ${
                customerError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
              }`}
            />
            <datalist id="customers-list">
              {customers.map(c => <option key={c.id} value={c.name} />)}
            </datalist>
            {customerError && <p className="text-red-600 text-sm mt-1 font-semibold">{customerError}</p>}
          </div>

          {/* التاريخ */}
          <div>
            <label className="form-label">التاريخ 📅</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="form-input border-2"
            />
          </div>

          {/* جدول المواد */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="form-label mb-0">📦 المواد المباعة</label>
              <button 
                type="button" 
                onClick={handleAddItem}
                className="text-blue-600 hover:text-blue-800 font-semibold text-sm"
              >
                + إضافة مادة
              </button>
            </div>
            {itemsError && <p className="text-red-600 text-sm mb-2 font-semibold">{itemsError}</p>}
            
            {formData.items.length > 0 ? (
              <div className="border-2 border-gray-200 rounded-lg overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-700">تسلسل</th>
                      <th className="px-3 py-2 text-right text-xs font-bold text-gray-700">اسم المادة</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">الكمية</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">السعر الفردي</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">الإجمالي</th>
                      <th className="px-3 py-2 text-center text-xs font-bold text-gray-700">إجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {formData.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-sm text-center font-semibold text-gray-700">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <select
                            required
                            value={item.productId}
                            onChange={(e) => handleUpdateItem(idx, 'productId', e.target.value)}
                            className="form-input text-sm"
                          >
                            <option value="">اختر المادة</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            required
                            value={item.qty}
                            onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                            className="form-input text-sm text-center w-20"
                          />
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-semibold text-gray-700">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="px-3 py-2 text-center text-sm font-bold text-blue-600">
                          {formatCurrency((item.price || 0) * (item.qty || 0))}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-red-600 hover:text-red-800 font-bold"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center text-gray-500">
                <p>لم تضف أي مواد بعد</p>
              </div>
            )}
          </div>

          {/* ملخص المبلغ وحالة الدفع */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3 border-2 border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-700">الإجمالي الفرعي:</span>
              <span className="text-lg font-bold text-blue-600">{formatCurrency(calculateTotal())}</span>
            </div>
            
            <div>
              <label className="form-label text-sm">💳 حالة الدفع</label>
              <select
                value={formData.paymentStatus}
                onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value, partialAmount: 0 })}
                className="form-input text-sm"
              >
                <option value="unpaid">❌ غير مدفوع</option>
                <option value="partial">⏳ دفعة جزئية</option>
                <option value="paid">✅ مدفوع بالكامل</option>
              </select>
            </div>

            {formData.paymentStatus === 'partial' && (
              <div>
                <label className="form-label text-sm">المبلغ الجزئي المدفوع 💰</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.partialAmount}
                  onChange={(e) => setFormData({ ...formData, partialAmount: parseFloat(e.target.value) || 0 })}
                  className="form-input text-sm"
                />
              </div>
            )}

            <div className="pt-2 border-t-2 border-gray-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">المدفوع:</span>
                <span className="text-sm font-bold text-green-600">
                  {formatCurrency(
                    formData.paymentStatus === 'partial' 
                      ? (formData.partialAmount || 0) 
                      : (formData.paymentStatus === 'paid' ? calculateTotal() : 0)
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-semibold text-gray-700">المتبقي:</span>
                <span className={`text-sm font-bold ${calculateRemaining() > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatCurrency(calculateRemaining())}
                </span>
              </div>
            </div>
          </div>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              {editingId ? '✏️ حفظ التعديلات' : '💾 إنشاء الفاتورة'}
            </button>
            <button 
              type="button" 
              onClick={() => { setShowModal(false); resetForm(); }} 
              className="btn btn-secondary flex-1"
            >
              ❌ إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal للطباعة */}
      {printingInvoice && (
        <Modal isOpen={true} title={`🖨️ طباعة الفاتورة #${printingInvoice.id}`} onClose={() => setPrintingInvoice(null)}>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* رأس الفاتورة */}
            <div className="border-b-2 pb-4">
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">رقم الفاتورة</p>
                  <p className="text-lg font-bold text-blue-600">#{printingInvoice.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">التاريخ</p>
                  <p className="text-lg font-bold">{formatIraqDate(printingInvoice.date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">اسم الحساب</p>
                  <p className="text-lg font-bold">{printingInvoice.customerName}</p>
                </div>
              </div>
            </div>

            {/* جدول المواد */}
            {printingInvoice.items && printingInvoice.items.length > 0 && (
              <div>
                <h4 className="font-bold text-sm mb-2">📦 تفاصيل المواد</h4>
                <table className="w-full text-sm border border-gray-300">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="border px-2 py-1 text-right">#</th>
                      <th className="border px-2 py-1 text-right">اسم المادة</th>
                      <th className="border px-2 py-1 text-center">الكمية</th>
                      <th className="border px-2 py-1 text-center">السعر</th>
                      <th className="border px-2 py-1 text-center">الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {printingInvoice.items.map((item, i) => (
                      <tr key={i}>
                        <td className="border px-2 py-1">{i + 1}</td>
                        <td className="border px-2 py-1">{item.productName}</td>
                        <td className="border px-2 py-1 text-center">{item.qty}</td>
                        <td className="border px-2 py-1 text-center">{formatCurrency(item.price)}</td>
                        <td className="border px-2 py-1 text-center font-bold">{formatCurrency((item.price || 0) * (item.qty || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ملخص الدفع */}
            <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span className="font-bold">{formatCurrency(printingInvoice.total)}</span>
              </div>
              <div className="flex justify-between">
                <span>المدفوع:</span>
                <span className="font-bold text-green-600">{formatCurrency(printingInvoice.paidAmount || 0)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between">
                <span className="font-bold">المتبقي:</span>
                <span className={`font-bold ${(printingInvoice.total - (printingInvoice.paidAmount || 0)) > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatCurrency((printingInvoice.total || 0) - (printingInvoice.paidAmount || 0))}
                </span>
              </div>
            </div>

            {/* حالة الدفع والترحيل */}
            <div className="flex gap-3 text-sm">
              <div className="flex-1">
                <p className="text-gray-600 mb-1">حالة الدفع</p>
                {(() => {
                  const remaining = (printingInvoice.total || 0) - (printingInvoice.paidAmount || 0);
                  if (remaining === 0) {
                    return <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">✅ مدفوع</span>;
                  } else if ((printingInvoice.paidAmount || 0) > 0) {
                    return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-bold">⏳ جزئي</span>;
                  } else {
                    return <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">❌ معلق</span>;
                  }
                })()}
              </div>
              <div className="flex-1">
                <p className="text-gray-600 mb-1">حالة الترحيل</p>
                {printingInvoice.postStatus === 'posted' ? (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">✅ مرحل</span>
                ) : (
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-bold">⏳ معلق</span>
                )}
              </div>
            </div>

            {/* أزرار الطباعة */}
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => window.print()} 
                className="btn btn-primary flex-1"
              >
                🖨️ طباعة
              </button>
              <button 
                onClick={() => setPrintingInvoice(null)} 
                className="btn btn-secondary flex-1"
              >
                ❌ إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AuthGuard>
  );
}
