'use client';

import { useState, useEffect, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';
import { Package, Plus, Edit, Trash2, Eye } from 'lucide-react';

export default function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [formData, setFormData] = useState({
    supplierId: '',
    suppliername: '',
    date: new Date().toISOString().slice(0, 10),
    total: 0,
    paidAmount: 0,
    items: [],
  });

  useEffect(() => {
    setUser(getStoredUser());
    fetchPurchases();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingId ? 'PUT' : 'POST';
      const payload = { ...formData, ...(editingId && { id: editingId }) };
      const res = await fetch('/api/purchases', { method, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error(await res.text());
      fetchPurchases();
      setShowModal(false);
      setEditingId(null);
      setFormData({
        supplierId: '',
        suppliername: '',
        date: new Date().toISOString().slice(0, 10),
        total: 0,
        paidAmount: 0,
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
      const res = await fetch(`/api/purchases?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await res.text());
      fetchPurchases();
      alert('تم الحذف بنجاح');
    } catch (error) {
      alert('خطأ: ' + error.message);
    }
  };

  const openEdit = (purchase) => {
    setEditingId(purchase.id);
    setFormData({
      supplierId: purchase.supplierId,
      suppliername: purchase.suppliername,
      date: purchase.date,
      total: purchase.total,
      paidAmount: purchase.paidAmount || 0,
      items: purchase.items || [],
    });
    setShowModal(true);
  };

  const columns = [
    { header: 'رقم الفاتورة', accessor: 'id', render: (row) => <span className="font-bold text-blue-600">{row.id}</span> },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'المورد', accessor: 'suppliername' },
    { header: 'المبلغ', accessor: 'total', render: (row) => formatCurrency(row.total) },
    { header: 'المدفوع', accessor: 'paidAmount', render: (row) => formatCurrency(row.paidAmount || 0) },
    { header: 'المتبقي', render: (row) => <span className="text-orange-600 font-bold">{formatCurrency((row.total || 0) - (row.paidAmount || 0))}</span> },
    {
      header: 'الحالة',
      render: (row) => (
        <div className="flex flex-col gap-1">
          <span className={`px-2 py-1 rounded text-xs font-bold ${row.paidAmount >= row.total ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {row.paidAmount >= row.total ? '✅ مدفوع' : '❌ متبقي'}
          </span>
          <span className={`px-2 py-1 rounded text-xs font-bold ${row.postStatus === 'posted' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
            {row.postStatus === 'posted' ? '📌 مرحّل' : '⏳ معلق'}
          </span>
        </div>
      ),
    },
    {
      header: 'الإجراءات',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => {
              setSelectedPurchase(row);
              setShowDetails(true);
            }}
            className="p-1 text-blue-600 hover:bg-blue-100 rounded"
          >
            <Eye size={18} />
          </button>
          {row.postStatus !== 'posted' && (
            <>
              <button onClick={() => openEdit(row)} className="p-1 text-orange-600 hover:bg-orange-100 rounded">
                <Edit size={18} />
              </button>
              <button onClick={() => handleDelete(row.id)} className="p-1 text-red-600 hover:bg-red-100 rounded">
                <Trash2 size={18} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">📦 فواتير المشتريات</h1>
          <p className="page-subtitle">إدارة وتتبع جميع عمليات الشراء</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({
              supplierId: '',
              suppliername: '',
              date: new Date().toISOString().slice(0, 10),
              total: 0,
              paidAmount: 0,
              items: [],
            });
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
          data={purchases}
          searchable={true}
          emptyMessage="لا توجد فواتير شراء مسجلة"
        />
      )}

      <Modal isOpen={showModal} title={editingId ? 'تعديل الفاتورة' : 'فاتورة جديدة'} onClose={() => setShowModal(false)}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="form-label">اسم المورد</label>
            <input
              type="text"
              required
              value={formData.suppliername}
              onChange={(e) => setFormData({ ...formData, suppliername: e.target.value })}
              className="form-input"
            />
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
            <label className="form-label">المبلغ الإجمالي</label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.total}
              onChange={(e) => setFormData({ ...formData, total: parseFloat(e.target.value) })}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">المبلغ المدفوع</label>
            <input
              type="number"
              step="0.01"
              value={formData.paidAmount || 0}
              onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) })}
              className="form-input"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="btn-primary flex-1">
              {editingId ? 'حفظ التعديلات' : 'إنشاء الفاتورة'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">
              إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {showDetails && selectedPurchase && (
        <Modal isOpen={showDetails} title={`تفاصيل الفاتورة ${selectedPurchase.id}`} onClose={() => setShowDetails(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">المورد</p>
                <p className="font-bold text-gray-900">{selectedPurchase.suppliername}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="font-bold text-gray-900">{selectedPurchase.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">المبلغ الإجمالي</p>
                <p className="font-bold text-green-600">{formatCurrency(selectedPurchase.total)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">المدفوع</p>
                <p className="font-bold text-blue-600">{formatCurrency(selectedPurchase.paidAmount || 0)}</p>
              </div>
            </div>
            {selectedPurchase.items && selectedPurchase.items.length > 0 && (
              <div>
                <h4 className="font-bold mb-2">المنتجات:</h4>
                <div className="space-y-2">
                  {selectedPurchase.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm border-b pb-2">
                      <span>{item.productName}</span>
                      <span>{item.qty} × {formatCurrency(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}
    </AuthGuard>
  );
}
