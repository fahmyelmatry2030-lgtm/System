'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';

export default function InventoryPage() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [nameError, setNameError] = useState('');
  const [skuError, setSkuError] = useState('');
  const [priceError, setPriceError] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/products');
      const json = await res.json();
      setData(json.products || json.data || json || []);
      
      // Extract unique categories
      const uniqueCategories = [...new Set((json.products || json.data || json || []).map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
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
    setNameError('');
    setSkuError('');
    setPriceError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setNameError('');
    setSkuError('');
    setPriceError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟')) {
      try {
        await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
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
    
    // Reset errors
    setNameError('');
    setSkuError('');
    setPriceError('');

    // Validate name uniqueness
    const nameExists = data.some(item => item.name === payload.name && item.id !== editingItem?.id);
    if (nameExists) {
      setNameError('اسم المنتج موجود مسبقاً');
      return;
    }

    // Validate SKU uniqueness
    const skuExists = data.some(item => item.sku === payload.sku && item.id !== editingItem?.id);
    if (skuExists) {
      setSkuError('رمز المنتج موجود مسبقاً');
      return;
    }

    // Validate sell price >= purchase price
    const purchasePrice = parseFloat(payload.purchasePrice) || 0;
    const sellPrice = parseFloat(payload.sellPrice) || 0;
    if (sellPrice < purchasePrice) {
      setPriceError('سعر البيع لا يمكن أن يكون أقل من سعر الشراء');
      return;
    }
    
    try {
      if (editingItem) {
        await fetch('/api/products', {
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
    { 
      header: 'سعر الشراء', 
      accessor: 'purchasePrice', 
      render: (row) => user?.role === 'rep' ? '-' : formatCurrency(row.purchasePrice) 
    },
    { header: 'سعر البيع', accessor: 'sellPrice', render: (row) => formatCurrency(row.sellPrice) },
    { 
      header: 'تاريخ الانتهاء', 
      accessor: 'expiryDate',
      render: (row) => {
        if (!row.expiryDate) return '-';
        const today = new Date().toISOString().split('T')[0];
        const isExpired = row.expiryDate < today;
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() + 30);
        const isNearExpiry = !isExpired && row.expiryDate <= warningDate.toISOString().split('T')[0];
        return (
          <span style={{ color: isExpired ? 'var(--danger)' : isNearExpiry ? 'var(--warning)' : 'var(--text-muted)', fontWeight: isExpired || isNearExpiry ? 'bold' : 'normal' }}>
            {row.expiryDate}{isNearExpiry ? ' ⚠️' : ''}{isExpired ? ' (منتهي)' : ''}
          </span>
        );
      }
    },
    { 
      header: 'إجراءات', 
      render: (item) => {
        const isRep = user?.role === 'rep';
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => handleEdit(item)} 
              className={isRep ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:underline'}
              disabled={isRep}
            >
              تعديل
            </button>
            <button 
              onClick={() => handleDelete(item.id)} 
              className={isRep ? 'text-gray-400 cursor-not-allowed' : 'text-red-500 hover:underline'}
              disabled={isRep}
            >
              حذف
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
          <h1 className="page-title">إدارة المخزون</h1>
          <p className="page-subtitle">إضافة وتعديل ومتابعة المنتجات والكميات المتوفرة</p>
        </div>
      </div>

      <DataTable 
        title="قائمة المنتجات" 
        columns={columns} 
        data={data}
        actions={
          user?.role !== 'rep' && (
            <button className="btn btn-primary" onClick={handleAdd}>
              + إضافة منتج
            </button>
          )
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'تعديل منتج' : 'إضافة منتج جديد'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="form-label">اسم المنتج</label>
            <input 
              name="name" 
              defaultValue={editingItem?.name || ''} 
              required 
              className={`form-input ${nameError ? 'border-red-500' : ''}`} 
            />
            {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="form-label">رمز المنتج (SKU)</label>
            <input 
              name="sku" 
              defaultValue={editingItem?.sku || ''} 
              className={`form-input ${skuError ? 'border-red-500' : ''}`} 
            />
            {skuError && <p className="text-red-500 text-sm mt-1">{skuError}</p>}
          </div>
          <div>
            <label className="form-label">الفئة</label>
            <select 
              name="category" 
              defaultValue={editingItem?.category || ''} 
              className="form-input"
            >
              <option value="">اختر الفئة أو أدخل فئة جديدة</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">الكمية</label>
            <input name="qty" type="number" defaultValue={editingItem?.qty || 0} required className="form-input" />
          </div>
          <div className="form-row">
            <div>
              <label className="form-label">سعر الشراء (د.ع)</label>
              <input name="purchasePrice" type="number" step="0.01" defaultValue={editingItem?.purchasePrice || 0} required className="form-input" />
            </div>
            <div>
              <label className="form-label">سعر البيع (د.ع)</label>
              <input 
                name="sellPrice" 
                type="number" 
                step="0.01" 
                defaultValue={editingItem?.sellPrice || 0} 
                required 
                className={`form-input ${priceError ? 'border-red-500' : ''}`} 
              />
              {priceError && <p className="text-red-500 text-sm mt-1">{priceError}</p>}
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
