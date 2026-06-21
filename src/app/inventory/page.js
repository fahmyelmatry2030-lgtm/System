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
    const user = getStoredUser();
    if (user?.role === 'rep') {
      alert('⛔ لا توجد صلاحية لإضافة منتجات جديدة');
      return;
    }
    setEditingItem(null);
    setNameError('');
    setSkuError('');
    setPriceError('');
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    const user = getStoredUser();
    if (user?.role === 'rep') {
      alert('⛔ لا توجد صلاحية لتعديل المنتجات');
      return;
    }
    setEditingItem(item);
    setNameError('');
    setSkuError('');
    setPriceError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const user = getStoredUser();
    if (user?.role === 'rep') {
      alert('⛔ لا توجد صلاحية لحذف المنتجات');
      return;
    }
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) {
      try {
        const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if (res.ok) {
          fetchData();
          alert('✅ تم حذف المنتج بنجاح');
        } else {
          alert('❌ خطأ: فشل حذف المنتج');
        }
      } catch (err) {
        console.error(err);
        alert('❌ خطأ: ' + err.message);
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
    const nameExists = data.some(item => item.name.trim() === payload.name.trim() && item.id !== editingItem?.id);
    if (nameExists) {
      setNameError('⚠️ اسم المنتج موجود بالفعل');
      return;
    }

    // Validate SKU uniqueness
    if (payload.sku) {
      const skuExists = data.some(item => item.sku === payload.sku && item.id !== editingItem?.id);
      if (skuExists) {
        setSkuError('⚠️ رمز المنتج موجود بالفعل');
        return;
      }
    }

    // Validate sell price >= purchase price
    const purchasePrice = parseFloat(payload.purchasePrice) || 0;
    const sellPrice = parseFloat(payload.sellPrice) || 0;
    if (sellPrice < purchasePrice) {
      setPriceError('⚠️ سعر البيع لا يمكن أن يكون أقل من سعر الشراء');
      return;
    }
    
    try {
      const user = getStoredUser();
      if (user?.role === 'rep') {
        alert('⛔ لا توجد صلاحية لإضافة أو تعديل المنتجات');
        return;
      }

      if (editingItem) {
        payload.id = editingItem.id;
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
      alert('✅ تم الحفظ بنجاح');
    } catch (err) {
      console.error(err);
      alert('❌ خطأ: ' + err.message);
    }
  };

  const columns = [
    { header: '#', render: (_, idx) => idx + 1 },
    { header: '📦 اسم المنتج', accessor: 'name' },
    { header: '🆔 رمز المنتج (SKU)', accessor: 'sku', render: (row) => row.sku || '-' },
    { header: '📂 الفئة', accessor: 'category', render: (row) => row.category || '-' },
    { 
      header: '📊 الكمية', 
      accessor: 'qty',
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: (row.qty || 0) <= (row.threshold || 5) ? '#ef4444' : '#22c55e' }}>
          {row.qty}
        </span>
      )
    },
    { 
      header: '💰 سعر الشراء', 
      accessor: 'purchasePrice', 
      render: (row) => user?.role === 'rep' ? '🔒' : formatCurrency(row.purchasePrice) 
    },
    { header: '🛒 سعر البيع', accessor: 'sellPrice', render: (row) => formatCurrency(row.sellPrice) },
    { 
      header: '📅 الصلاحية', 
      accessor: 'expiryDate',
      render: (row) => {
        if (!row.expiryDate) return '-';
        const today = new Date().toISOString().split('T')[0];
        const isExpired = row.expiryDate < today;
        return (
          <span style={{ 
            color: isExpired ? '#ef4444' : '#666', 
            fontWeight: isExpired ? 'bold' : 'normal'
          }}>
            {row.expiryDate}{isExpired ? ' ⛔' : ''}
          </span>
        );
      }
    },
    { 
      header: '⚙️ إجراءات', 
      render: (item) => {
        const isRep = user?.role === 'rep';
        const isAdmin = user?.role === 'admin' || user?.role === 'accountant';
        return (
          <div className="flex gap-2">
            <button 
              onClick={() => handleEdit(item)} 
              className={`transition-all ${isRep ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-blue-600 hover:underline cursor-pointer'}`}
              disabled={isRep}
              title={isRep ? 'لا توجد صلاحية' : 'تعديل'}
            >
              ✏️ تعديل
            </button>
            <button 
              onClick={() => handleDelete(item.id)} 
              className={`transition-all ${isRep ? 'text-gray-300 cursor-not-allowed opacity-50' : 'text-red-600 hover:underline cursor-pointer'}`}
              disabled={isRep}
              title={isRep ? 'لا توجد صلاحية' : 'حذف'}
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
          <h1 className="page-title">📦 إدارة المخزون</h1>
          <p className="page-subtitle">إضافة وتعديل ومتابعة المنتجات والكميات المتوفرة</p>
        </div>
        {user?.role !== 'rep' && (
          <button className="btn btn-primary flex items-center gap-2" onClick={handleAdd}>
            ➕ إضافة منتج
          </button>
        )}
      </div>

      {data.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
          <p className="text-gray-600 text-lg">📭 لا توجد منتجات مسجلة بعد</p>
          {user?.role !== 'rep' && (
            <button className="btn btn-primary mt-4 mx-auto" onClick={handleAdd}>
              ➕ أضف منتج الآن
            </button>
          )}
        </div>
      ) : (
        <DataTable 
          title="📊 قائمة المنتجات" 
          columns={columns} 
          data={data}
        />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? '✏️ تعديل منتج' : '➕ إضافة منتج جديد'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="form-label">📦 اسم المنتج</label>
            <input 
              name="name" 
              defaultValue={editingItem?.name || ''} 
              required 
              maxLength="100"
              className={`form-input border-2 transition-colors ${nameError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`} 
            />
            {nameError && <p className="text-red-600 text-sm mt-1 font-semibold">{nameError}</p>}
          </div>
          
          <div>
            <label className="form-label">🆔 رمز المنتج (SKU)</label>
            <input 
              name="sku" 
              defaultValue={editingItem?.sku || ''} 
              maxLength="50"
              className={`form-input border-2 transition-colors ${skuError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`} 
            />
            {skuError && <p className="text-red-600 text-sm mt-1 font-semibold">{skuError}</p>}
          </div>
          
          <div>
            <label className="form-label">📂 الفئة</label>
            <input 
              name="category" 
              list="category-list"
              defaultValue={editingItem?.category || ''} 
              maxLength="50"
              placeholder="اكتب الفئة أو اخترها"
              className="form-input border-2"
            />
            <datalist id="category-list">
              {categories.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>
          </div>
          
          <div>
            <label className="form-label">📊 الكمية</label>
            <input 
              name="qty" 
              type="number" 
              min="0"
              step="1"
              defaultValue={editingItem?.qty || 0} 
              required 
              className="form-input border-2"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">💵 سعر الشراء</label>
              <input 
                name="purchasePrice" 
                type="number" 
                step="0.01"
                min="0"
                defaultValue={editingItem?.purchasePrice || 0} 
                required 
                className="form-input border-2"
              />
            </div>
            <div>
              <label className="form-label">🛒 سعر البيع</label>
              <input 
                name="sellPrice" 
                type="number" 
                step="0.01"
                min="0"
                defaultValue={editingItem?.sellPrice || 0} 
                required 
                className={`form-input border-2 transition-colors ${priceError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'}`} 
              />
              {priceError && <p className="text-red-600 text-xs mt-1 font-semibold">{priceError}</p>}
            </div>
          </div>
          
          <div>
            <label className="form-label">📅 تاريخ انتهاء الصلاحية</label>
            <input 
              name="expiryDate" 
              type="date" 
              defaultValue={editingItem?.expiryDate || ''} 
              className="form-input border-2"
            />
          </div>
          
          <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              ❌ إلغاء
            </button>
            <button type="submit" className="btn btn-primary">
              💾 حفظ
            </button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
