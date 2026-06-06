'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';

export default function CustomersPage() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      setData(json.customers || json.data || json || []);
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
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await fetch(`/api/customers/${id}`, { method: 'DELETE' });
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
        await fetch(`/api/customers/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/customers', {
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
    { header: 'اسم العميل', accessor: 'name' },
    { header: 'رقم الهاتف', accessor: 'phone' },
    { 
      header: 'الرصيد', 
      accessor: 'balance',
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.balance > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
          {row.balance} ﷼
        </span>
      )
    },
    { 
      header: 'تاريخ الإضافة', 
      accessor: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ar-EG')
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
          <h1 className="page-title">إدارة العملاء</h1>
          <p className="page-subtitle">إضافة وتعديل ومتابعة بيانات العملاء وأرصدتهم</p>
        </div>
      </div>

      <DataTable 
        title="قائمة العملاء" 
        columns={columns} 
        data={data}
        actions={
          <button className="btn btn-primary" onClick={handleAdd}>
            + إضافة عميل
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'تعديل عميل' : 'إضافة عميل جديد'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="form-label">اسم العميل</label>
            <input name="name" defaultValue={editingItem?.name || ''} required className="form-input" />
          </div>
          <div>
            <label className="form-label">رقم الهاتف</label>
            <input name="phone" defaultValue={editingItem?.phone || ''} className="form-input" />
          </div>
          <div>
            <label className="form-label">الرصيد الافتتاحي (﷼)</label>
            <input name="balance" type="number" step="0.01" defaultValue={editingItem?.balance || 0} className="form-input" />
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
