'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';

export default function InventoryPage() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      setData(json.products || json.data || json || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);
    
    try {
      if (editingItem) {
        await fetch(`/api/products/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: 'اسم المنتج', accessor: 'name' },
    { header: 'رمز المنتج (SKU)', accessor: 'sku' },
    { header: 'الفئة', accessor: 'category' },
    { 
      header: 'الكمية', 
      accessor: 'qty',
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.qty <= row.threshold ? 'var(--danger)' : 'var(--success)' }}>
          {row.qty}
        </span>
      )
    },
    { header: 'سعر الشراء', accessor: 'purchasePrice', render: (row) => `${row.purchasePrice} ﷼` },
    { header: 'سعر البيع', accessor: 'sellPrice', render: (row) => `${row.sellPrice} ﷼` },
    { 
      header: 'تاريخ الانتهاء', 
      accessor: 'expiryDate',
      render: (row) => {
        if (!row.expiryDate) return '-';
        const today = new Date().toISOString().split('T')[0];
        const isExpired = row.expiryDate < today;
        return (
          <span style={{ color: isExpired ? 'var(--danger)' : 'var(--text-muted)', fontWeight: isExpired ? 'bold' : 'normal' }}>
            {row.expiryDate}
          </span>
        );
      }
    },
    { 
      header: 'إجراءات', 
      render: (item) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(item)} className="text-blue-500 hover:underline">تعديل</button>
          <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline">حذف</button>
        </div>
      )
    }
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة المخزون</h1>
          <p className="page-subtitle">إضافة وتعديل ومتابعة المنتجات والكميات المتوفرة</p>
        </div>
      </div>

      <DataTable 
        title="قائمة المنتجات" 
        columns={columns} 
        data={data}
        actions={
          <button className="btn btn-primary" onClick={handleAdd}>
            + إضافة منتج
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'تعديل منتج' : 'إضافة منتج جديد'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="form-label">اسم المنتج</label>
            <input name="name" defaultValue={editingItem?.name || ''} required className="form-input" />
          </div>
          <div>
            <label className="form-label">رمز المنتج (SKU)</label>
            <input name="sku" defaultValue={editingItem?.sku || ''} className="form-input" />
          </div>
          <div>
            <label className="form-label">الفئة</label>
            <input name="category" defaultValue={editingItem?.category || ''} className="form-input" />
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">الكمية</label>
              <input name="qty" type="number" defaultValue={editingItem?.qty || 0} required className="form-input" />
            </div>
            <div>
              <label className="form-label">حد الطلب</label>
              <input name="threshold" type="number" defaultValue={editingItem?.threshold || 5} className="form-input" />
            </div>
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">سعر الشراء (﷼)</label>
              <input name="purchasePrice" type="number" step="0.01" defaultValue={editingItem?.purchasePrice || 0} required className="form-input" />
            </div>
            <div>
              <label className="form-label">سعر البيع (﷼)</label>
              <input name="sellPrice" type="number" step="0.01" defaultValue={editingItem?.sellPrice || 0} required className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">تاريخ انتهاء الصلاحية</label>
            <input name="expiryDate" type="date" defaultValue={editingItem?.expiryDate || ''} className="form-input" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
