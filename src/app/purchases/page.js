'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';
import { formatIraqDate } from '@/lib/date-utils';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [supplierSearch, setSupplierSearch] = useState('');
  const [formData, setFormData] = useState({
    supplierId: '',
    suppliername: '',
    date: new Date().toISOString().slice(0, 10),
    total: 0,
    paidAmount: 0,
    notes: '',
    items: [],
  });

  useEffect(() => {
    setUser(getStoredUser());
    fetchPurchases();
    fetchSuppliers();
  }, []);

  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/purchases');
      const data = await res.json();
      setPurchases(data.purchases || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // ✅ Validation checks
    if (!formData.suppliername.trim()) {
      alert('⚠️ يرجى إدخال اسم المورد');
      return;
    }
    
    if (!formData.date.trim()) {
      alert('⚠️ يرجى اختيار التاريخ');
      return;
    }
    
    if (!formData.total || formData.total <= 0) {
      alert('⚠️ يرجى إدخال مبلغ إجمالي أكبر من صفر');
      return;
    }
    
    if (formData.paidAmount < 0) {
      alert('⚠️ لا يمكن أن يكون المبلغ المدفوع سالباً');
      return;
    }
    
    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload = { 
        ...formData, 
        paidAmount: parseFloat(formData.paidAmount) || 0,
        total: parseFloat(formData.total) || 0,
        postStatus: 'pending',
        ...(editingId && { id: editingId }) 
      };
      
      console.log('Sending purchase payload:', payload);
      
      const res = await fetch('/api/purchases', { 
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'فشل الحفظ');
      }
      
      const result = await res.json();
      console.log('Purchase saved:', result);
      
      fetchPurchases();
      setShowModal(false);
      setEditingId(null);
      setFormData({
        supplierId: '',
        suppliername: '',
        date: new Date().toISOString().slice(0, 10),
        total: 0,
        paidAmount: 0,
        notes: '',
        items: [],
      });
      alert('✅ تم ' + (editingId ? 'تحديث' : 'إنشاء') + ' الفاتورة بنجاح');
    } catch (error) {
      console.error('Purchase error:', error);
      alert('❌ خطأ: ' + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      const res = await fetch(`/api/purchases?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchPurchases();
      alert('✅ تم حذف الفاتورة بنجاح');
    } catch (error) {
      console.error(error);
      alert('❌ خطأ: ' + error.message);
    }
  };

  const openEdit = (purchase) => {
    setEditingId(purchase.id);
    setSupplierSearch(purchase.suppliername);
    setFormData({
      supplierId: purchase.supplierId,
      suppliername: purchase.suppliername,
      date: purchase.date,
      total: purchase.total,
      paidAmount: purchase.paidAmount || 0,
      notes: purchase.notes || '',
      items: purchase.items || [],
    });
    setShowModal(true);
  };

  const columns = [
    { header: '#', render: (_, idx) => idx + 1 },
    { header: '📄 رقم الفاتورة', accessor: 'id', render: (row) => <span className="font-bold text-blue-600">#{row.id}</span> },
    { header: '📅 التاريخ', accessor: 'date', render: (row) => formatIraqDate(row.date) },
    { header: '🏪 المورد', accessor: 'suppliername', render: (row) => row.suppliername || '—' },
    { header: '💰 المبلغ', accessor: 'total', render: (row) => <span className="font-bold">{formatCurrency(row.total)}</span> },
    { header: '✅ المدفوع', accessor: 'paidAmount', render: (row) => <span className="font-bold text-green-600">{formatCurrency(row.paidAmount || 0)}</span> },
    { 
      header: '⏳ المتبقي', 
      render: (row) => {
        const remaining = (row.total || 0) - (row.paidAmount || 0);
        return <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-gray-500'}`}>{formatCurrency(remaining)}</span>;
      }
    },
    {
      header: '📌 الحالة',
      render: (row) => {
        const isPaid = (row.paidAmount || 0) >= (row.total || 0);
        const isPosted = row.postStatus === 'posted';
        return (
          <div className="flex gap-1">
            <span className={`px-2 py-1 rounded text-xs font-bold ${isPaid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {isPaid ? '✅ مدفوع' : '❌ معلق'}
            </span>
            <span className={`px-2 py-1 rounded text-xs font-bold ${isPosted ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
              {isPosted ? '📌 مرحّل' : '⏳ معلق'}
            </span>
          </div>
        );
      },
    },
    {
      header: '⚙️ الإجراءات',
      render: (row) => {
        const isPosted = row.postStatus === 'posted';
        return (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedPurchase(row);
                setShowDetails(true);
              }}
              className="text-blue-600 hover:text-blue-800 transition-colors"
              title="عرض التفاصيل"
            >
              👁️ عرض
            </button>
            {!isPosted && (
              <>
                <button 
                  onClick={() => openEdit(row)} 
                  className="text-orange-600 hover:text-orange-800 transition-colors"
                  title="تعديل"
                >
                  ✏️ تعديل
                </button>
                <button 
                  onClick={() => handleDelete(row.id)} 
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="حذف"
                >
                  🗑️ حذف
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">📦 فواتير المشتريات</h1>
          <p className="page-subtitle">إدارة وتتبع جميع عمليات الشراء من الموردين</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setSupplierSearch('');
            setFormData({
              supplierId: '',
              suppliername: '',
              date: new Date().toISOString().slice(0, 10),
              total: 0,
              paidAmount: 0,
              notes: '',
              items: [],
            });
            setShowModal(true);
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          ➕ فاتورة جديدة
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : purchases.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg">📭 لا توجد فواتير شراء مسجلة</p>
          <button 
            onClick={() => {
              setShowModal(true);
              setFormData({
                supplierId: '',
                suppliername: '',
                date: new Date().toISOString().slice(0, 10),
                total: 0,
                paidAmount: 0,
                notes: '',
                items: [],
              });
            }}
            className="btn btn-primary mt-4 mx-auto"
          >
            ➕ أضف فاتورة الآن
          </button>
        </div>
      ) : (
        <DataTable
          title="📊 قائمة الفواتير"
          columns={columns}
          data={purchases}
          emptyMessage="📭 لا توجد فواتير شراء"
        />
      )}

      <Modal isOpen={showModal} title={editingId ? '✏️ تعديل الفاتورة' : '➕ فاتورة شراء جديدة'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">🏪 اسم المورد</label>
            <input
              type="text"
              required
              value={supplierSearch}
              onChange={(e) => {
                setSupplierSearch(e.target.value);
                const supplier = suppliers.find(s => s.name === e.target.value);
                if (supplier) {
                  setFormData({ ...formData, supplierId: supplier.id, suppliername: supplier.name });
                } else {
                  setFormData({ ...formData, suppliername: e.target.value });
                }
              }}
              className="form-input border-2"
              placeholder="اكتب اسم المورد أو اختره من القائمة"
              list="suppliers-list"
            />
            <datalist id="suppliers-list">
              {suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase())).map(s => (
                <option key={s.id} value={s.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label className="form-label">📅 التاريخ</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="form-input border-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">💰 المبلغ الإجمالي</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.total}
                onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) || 0 })}
                className="form-input border-2"
              />
            </div>
            <div>
              <label className="form-label">✅ المبلغ المدفوع</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.paidAmount || 0}
                onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                className="form-input border-2"
              />
            </div>
          </div>

          <div>
            <label className="form-label">📝 ملاحظات</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="form-input border-2"
              rows="3"
              placeholder="مثال: شروط الدفع، أسعار خاصة، إلخ..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn btn-primary flex-1">
              💾 {editingId ? 'حفظ التعديلات' : 'إنشاء الفاتورة'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">
              ❌ إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {showDetails && selectedPurchase && (
        <Modal isOpen={showDetails} title={`📄 تفاصيل الفاتورة #${selectedPurchase.id}`} onClose={() => setShowDetails(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 pb-4 border-b-2">
              <div>
                <p className="text-xs text-gray-600 mb-1 font-semibold">المورد</p>
                <p className="font-bold text-gray-900">{selectedPurchase.suppliername || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1 font-semibold">التاريخ</p>
                <p className="font-bold text-gray-900">{formatIraqDate(selectedPurchase.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1 font-semibold">المبلغ الإجمالي</p>
                <p className="font-bold text-lg text-green-600">{formatCurrency(selectedPurchase.total)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1 font-semibold">المدفوع</p>
                <p className="font-bold text-lg text-blue-600">{formatCurrency(selectedPurchase.paidAmount || 0)}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-2 font-semibold">المتبقي</p>
              <p className={`font-bold text-lg ${(selectedPurchase.total || 0) - (selectedPurchase.paidAmount || 0) > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                {formatCurrency((selectedPurchase.total || 0) - (selectedPurchase.paidAmount || 0))}
              </p>
            </div>

            {selectedPurchase.notes && (
              <div>
                <p className="text-xs text-gray-600 mb-1 font-semibold">ملاحظات</p>
                <p className="text-sm text-gray-700 bg-yellow-50 p-2 rounded border-l-4 border-yellow-400">{selectedPurchase.notes}</p>
              </div>
            )}

            {selectedPurchase.items && selectedPurchase.items.length > 0 && (
              <div>
                <h4 className="font-bold mb-2 text-sm">📦 المنتجات:</h4>
                <div className="space-y-2 border-t pt-2">
                  {selectedPurchase.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm pb-2 border-b">
                      <span className="font-semibold">{item.productName}</span>
                      <span className="text-gray-700">{item.qty} × {formatCurrency(item.price)} = {formatCurrency(item.qty * item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => window.print()} 
                className="btn btn-primary flex-1"
              >
                🖨️ طباعة
              </button>
              <button 
                onClick={() => setShowDetails(false)} 
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
