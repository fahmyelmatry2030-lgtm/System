'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';
import { ShoppingCart, Plus, Edit, Trash2, Printer, X, Check } from 'lucide-react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [customerError, setCustomerError] = useState('');
  const [itemsError, setItemsError] = useState('');
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    date: new Date().toISOString().slice(0, 10),
    paymentStatus: 'unpaid',
    partialAmount: 0,
    items: [],
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

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', productName: '', qty: 1, price: 0, total: 0 }],
    });
  };

  const removeItem = (index) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    if (field === 'productId') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].productName = product.name;
        updatedItems[index].price = product.sellPrice;
        updatedItems[index].total = product.sellPrice * updatedItems[index].qty;
      }
    } else if (field === 'qty') {
      updatedItems[index].total = updatedItems[index].price * value;
    }

    setFormData({ ...formData, items: updatedItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
  };

  const calculateRemaining = () => {
    const total = calculateTotal();
    const paid = formData.paymentStatus === 'partial' ? formData.partialAmount : (formData.paymentStatus === 'paid' ? total : 0);
    return total - paid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate customer
    if (!formData.customerName || formData.customerName.trim() === '') {
      setCustomerError('يرجى إدخال اسم العميل');
      return;
    }
    setCustomerError('');

    // Validate items
    if (formData.items.length === 0) {
      setItemsError('يرجى إضافة مادة واحدة على الأقل');
      return;
    }
    setItemsError('');

    try {
      const total = calculateTotal();
      const paidAmount = formData.paymentStatus === 'partial' ? formData.partialAmount : (formData.paymentStatus === 'paid' ? total : 0);
      
      const method = editingId ? 'PUT' : 'POST';
      const payload = {
        ...formData,
        total,
        paidAmount,
        items: formData.items,
        postStatus: 'pending',
        ...(editingId && { id: editingId }),
      };
      
      const res = await fetch('/api/sales', { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      fetchSales();
      setShowModal(false);
      setEditingId(null);
      setFormData({
        customerId: '',
        customerName: '',
        date: new Date().toISOString().slice(0, 10),
        paymentStatus: 'unpaid',
        partialAmount: 0,
        items: [],
      });
      alert('تم بنجاح');
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من الحذف؟')) return;
    try {
      const res = await fetch(`/api/sales?id=${id}&role=${user?.role || ''}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchSales();
      alert('تم الحذف بنجاح');
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
  };

  const openEdit = (sale) => {
    setEditingId(sale.id);
    setFormData({
      customerId: sale.customerId,
      customerName: sale.customerName,
      date: sale.date,
      paymentStatus: sale.paymentStatus,
      partialAmount: sale.paidAmount || 0,
      items: sale.items || [],
    });
    setShowModal(true);
  };

  const columns = [
    { header: 'رقم الفاتورة', accessor: 'id', render: (row) => <span className="font-bold text-blue-600">{row.id}</span> },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'العميل', accessor: 'customerName' },
    { header: 'مبلغ الإجمالي', accessor: 'total', render: (row) => formatCurrency(row.total) },
    { header: 'المدفوع', accessor: 'paidAmount', render: (row) => formatCurrency(row.paidAmount || 0) },
    { 
      header: 'المتبقي', 
      render: (row) => {
        const remaining = (row.total || 0) - (row.paidAmount || 0);
        const isPaid = remaining === 0;
        return <span className={`font-bold ${isPaid ? 'text-gray-700' : 'text-red-600'}`}>{formatCurrency(remaining)}</span>;
      }
    },
    {
      header: 'حالة الدفع',
      render: (row) => {
        const remaining = (row.total || 0) - (row.paidAmount || 0);
        if (remaining === 0) {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1"><Check size={14} /> مدفوع</span>;
        } else if (row.paidAmount > 0) {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">مدفوع جزئي</span>;
        } else {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1"><X size={14} /> غير مدفوع</span>;
        }
      },
    },
    {
      header: 'حالة الترحيل',
      render: (row) => {
        if (row.postStatus === 'posted') {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1"><Check size={14} /> مرحل</span>;
        } else {
          return <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-700">معلق</span>;
        }
      },
    },
    {
      header: 'الإجراءات',
      render: (row) => {
        const isPosted = row.postStatus === 'posted';
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedSale(row);
                setShowModal(true);
                setEditingId(row.id);
              }}
              className={`p-1 ${isPosted ? 'text-gray-300 cursor-not-allowed' : 'text-orange-600 hover:bg-orange-100'} rounded`}
              disabled={isPosted}
            >
              <Edit size={18} />
            </button>
            <button
              onClick={() => {
                setSelectedSale(row);
                setShowModal(true);
                setEditingId(null);
              }}
              className="p-1 text-green-600 hover:bg-green-100 rounded"
              title="طباعة الفاتورة"
            >
              <Printer size={18} />
            </button>
            <button 
              onClick={() => handleDelete(row.id)} 
              className={`p-1 ${isPosted ? 'text-gray-300 cursor-not-allowed' : 'text-red-600 hover:bg-red-100'} rounded`}
              disabled={isPosted}
            >
              <Trash2 size={18} />
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
          <h1 className="page-title">📊 فواتير الكاشير</h1>
          <p className="page-subtitle">إدارة وتتبع جميع فواتير نقطة البيع</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              customerId: '',
              customerName: '',
              date: new Date().toISOString().slice(0, 10),
              paymentStatus: 'unpaid',
              partialAmount: 0,
              items: [],
            });
            setCustomerError('');
            setItemsError('');
            setShowModal(true);
          }}
          className="btn-primary flex gap-2"
        >
          <Plus size={20} /> فاتورة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <DataTable
          title="قائمة الفواتير"
          columns={columns}
          data={sales}
          searchable={true}
          emptyMessage="لا توجد فواتير بيع مسجلة"
        />
      )}

      <Modal isOpen={showModal} title={selectedSale ? 'طباعة الفاتورة' : (editingId ? 'تعديل الفاتورة' : 'فاتورة جديدة')} onClose={() => setShowModal(false)}>
        {selectedSale ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">رقم الفاتورة</p>
                <p className="font-bold text-gray-900">{selectedSale.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="font-bold text-gray-900">{selectedSale.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">العميل</p>
                <p className="font-bold text-gray-900">{selectedSale.customerName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">حالة الدفع</p>
                <p className="font-bold text-gray-900">{selectedSale.paymentStatus === 'paid' ? 'مدفوع' : (selectedSale.paymentStatus === 'partial' ? 'مدفوع جزئي' : 'غير مدفوع')}</p>
              </div>
            </div>
            {selectedSale.items && selectedSale.items.length > 0 && (
              <div>
                <h4 className="font-bold mb-2">المنتجات:</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">المادة</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">الكمية</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">السعر</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">الإجمالي</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSale.items.map((item, i) => (
                        <tr key={i} className="border-t">
                          <td className="px-3 py-2 text-sm">{item.productName}</td>
                          <td className="px-3 py-2 text-center text-sm">{item.qty}</td>
                          <td className="px-3 py-2 text-center text-sm">{formatCurrency(item.price)}</td>
                          <td className="px-3 py-2 text-center text-sm font-semibold">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">مبلغ الإجمالي:</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(selectedSale.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">المدفوع:</span>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(selectedSale.paidAmount || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">المتبقي:</span>
                <span className={`text-sm font-semibold ${(selectedSale.total - (selectedSale.paidAmount || 0)) > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatCurrency(selectedSale.total - (selectedSale.paidAmount || 0))}
                </span>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="btn-primary flex-1"
              >
                طباعة
              </button>
              <button type="button" onClick={() => { setShowModal(false); setSelectedSale(null); }} className="btn-secondary flex-1">
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">اسم العميل</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value);
                  setFormData({ 
                    ...formData, 
                    customerId: e.target.value, 
                    customerName: customer ? customer.name : '' 
                  });
                  setCustomerError('');
                }}
                className={`form-input ${customerError ? 'border-red-500' : ''}`}
              >
                <option value="">اختر العميل</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {customerError && <p className="text-red-500 text-sm mt-1">{customerError}</p>}
            </div>
            <div>
              <label className="form-label">التاريخ</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="form-label mb-0">المواد</label>
                <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">
                  + إضافة مادة
                </button>
              </div>
              {itemsError && <p className="text-red-500 text-sm mb-2">{itemsError}</p>}
              
              {formData.items.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-600">المادة</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">الكمية</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">السعر</th>
                        <th className="px-3 py-2 text-center text-xs font-semibold text-gray-600">الإجمالي</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="px-3 py-2">
                            <select
                              required
                              value={item.productId}
                              onChange={(e) => updateItem(index, 'productId', e.target.value)}
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
                              onChange={(e) => updateItem(index, 'qty', parseInt(e.target.value) || 1)}
                              className="form-input text-sm text-center"
                            />
                          </td>
                          <td className="px-3 py-2 text-center text-sm">
                            {formatCurrency(item.price)}
                          </td>
                          <td className="px-3 py-2 text-center text-sm font-semibold">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="px-3 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">مبلغ الإجمالي:</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(calculateTotal())}</span>
              </div>
              <div>
                <label className="form-label">حالة الدفع</label>
                <select 
                  value={formData.paymentStatus} 
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })} 
                  className="form-input"
                >
                  <option value="unpaid">غير مدفوع</option>
                  <option value="partial">دفعة جزئية</option>
                  <option value="paid">مدفوع بالكامل</option>
                </select>
              </div>
              {formData.paymentStatus === 'partial' && (
                <div>
                  <label className="form-label">المبلغ الجزئي المدفوع</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.partialAmount}
                    onChange={(e) => setFormData({ ...formData, partialAmount: parseFloat(e.target.value) })}
                    className="form-input"
                  />
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">المدفوع:</span>
                <span className="text-sm font-semibold text-gray-900">
                  {formData.paymentStatus === 'partial' 
                    ? formatCurrency(formData.partialAmount) 
                    : (formData.paymentStatus === 'paid' ? formatCurrency(calculateTotal()) : '0')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">المتبقي:</span>
                <span className={`text-sm font-semibold ${calculateRemaining() > 0 ? 'text-red-600' : 'text-gray-700'}`}>
                  {formatCurrency(calculateRemaining())}
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn-primary flex-1">
                {editingId ? 'حفظ التعديلات' : 'إنشاء الفاتورة'}
              </button>
              <button type="button" onClick={() => { setShowModal(false); setSelectedSale(null); }} className="btn-secondary flex-1">
                إلغاء
              </button>
            </div>
          </form>
        )}
      </Modal>
    </AuthGuard>
  );
}
