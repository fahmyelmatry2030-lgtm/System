'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';

export default function SuppliersPage() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [user, setUser] = useState(null);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/suppliers');
      const json = await res.json();
      setData(json.suppliers || json.data || json || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setUser(getStoredUser());
    const load = async () => {
      await fetchData();
    };

    load();
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
    if (confirm('هل أنت متأكد من حذف هذا المورد؟')) {
      try {
        await fetch(`/api/suppliers?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
        await fetch('/api/suppliers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/suppliers', {
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
    { header: '#', render: (_, index) => index + 1 },
    { header: 'اسم المورد', accessor: 'name' },
    { header: 'رقم الهاتف', accessor: 'phone' },
    { 
      header: 'الرصيد', 
      accessor: 'balance',
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.balance < 0 ? '#ef4444' : row.balance > 0 ? '#22c55e' : '#6b7280' }}>
          {formatCurrency(Math.abs(row.balance))}
        </span>
      )
    },
    { 
      header: 'تاريخ الإضافة', 
      accessor: 'createdAt',
      render: (row) => {
        const date = new Date(row.createdAt);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('ar-EG');
      },
    },
    { 
      header: 'إجراءات', 
      render: (item) => {
        const isAccountant = user?.role === 'accountant';
        return (
          <div className="flex gap-2">
            <button onClick={() => handleEdit(item)} className="text-blue-500 hover:underline">تعديل</button>
            <button 
              onClick={() => handleDelete(item.id)} 
              className={isAccountant ? 'text-red-300 cursor-not-allowed' : 'text-red-500 hover:underline'}
              disabled={isAccountant}
            >
              حذف
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة الموردين</h1>
          <p className="page-subtitle">إضافة وتعديل ومتابعة بيانات الموردين وأرصدتهم</p>
        </div>
      </div>

      <DataTable 
        title="قائمة الموردين" 
        columns={columns} 
        data={data}
        actions={
          <button className="btn btn-primary" onClick={handleAdd}>
            + إضافة مورد
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'تعديل مورد' : 'إضافة مورد جديد'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="form-label">اسم المورد</label>
            <input name="name" defaultValue={editingItem?.name || ''} required className="form-input" />
          </div>
          <div>
            <label className="form-label">رقم الهاتف</label>
            <input 
              type="tel"
              dir="ltr"
              name="phone" 
              defaultValue={editingItem?.phone || ''} 
              placeholder="(0772) 237 0807"
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, '');
                if (value.length > 11) {
                  value = value.substring(0, 11);
                }
                // Auto-format: (0772) 237 0807
                if (value.length >= 4) {
                  const part1 = value.substring(0, 4);
                  const part2 = value.substring(4, 7);
                  const part3 = value.substring(7, 11);
                  const formatted = '(' + part1 + ')' + (part2 ? ' ' + part2 : '') + (part3 ? ' ' + part3 : '');
                  e.target.value = formatted;
                } else {
                  e.target.value = value;
                }
              }}
              className="form-input" 
              maxLength="16"
            />
          </div>
          <input type="hidden" name="balance" value={editingItem?.balance || 0} />
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
