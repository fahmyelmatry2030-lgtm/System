'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import PostStatusBadge from '@/components/PostStatusBadge';
import PostActions from '@/components/PostActions';
import { formatCurrency } from '@/lib/currency';
import { withUser, getStoredUser } from '@/lib/api-client';

export default function ReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    type: 'supplier',
    entityId: '',
    entityName: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    items: [{ productId: '', qty: 1, price: 0 }]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retRes, supRes, custRes, prodRes] = await Promise.all([
        fetch('/api/returns'),
        fetch('/api/suppliers'),
        fetch('/api/customers'),
        fetch('/api/products')
      ]);
      
      const retData = await retRes.json();
      const supData = await supRes.json();
      const custData = await custRes.json();
      const prodData = await prodRes.json();
      
      setReturns(retData.returns || []);
      setSuppliers(supData.suppliers || []);
      setCustomers(custData.customers || []);
      setProducts(prodData.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      setUser(getStoredUser());
      await fetchData();
    };

    load();
  }, []);

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: '', qty: 1, price: 0 }]
    });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index][field] = value;
    
    // Auto-fill price when product is selected
    if (field === 'productId' && value) {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].price = formData.type === 'supplier' ? product.purchasePrice : product.sellPrice;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.entityName || formData.entityName.trim() === '') {
      alert('يرجى إدخال اسم الطرف المسترجع');
      return;
    }
    
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withUser({
          ...formData,
          total: calculateTotal(),
          items: formData.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
              productId: item.productId,
              productName: product ? product.name : '',
              qty: parseInt(item.qty),
              price: parseFloat(item.price),
              total: parseFloat(item.price) * parseInt(item.qty)
            };
          })
        }))
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    }
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا المرتج؟')) {
      try {
        await fetch(`/api/returns?id=${id}&role=${user?.role || ''}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const columns = [
    { header: 'رقم المرتج', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date' },
    { 
      header: 'النوع', 
      accessor: 'type',
      render: (row) => (
        <span className={`badge ${row.type === 'supplier' ? 'badge-warning' : 'badge-info'}`}>
          {row.type === 'supplier' ? 'مرتج مورد' : 'مرتج عميل'}
        </span>
      )
    },
    { header: 'الطرف', accessor: 'entityName' },
    { 
      header: 'الإجمالي', 
      accessor: 'total',
      render: (row) => <span style={{fontWeight: 'bold'}}>{formatCurrency(row.total)}</span>
    },
    { header: 'الترحيل', render: (row) => <PostStatusBadge record={row} /> },
    { header: 'السبب', accessor: 'reason' },
    { 
      header: 'إجراءات', 
      render: (item) => (
        <div className="flex gap-2 items-center">
          <PostActions entity="returns" record={item} onPosted={fetchData} />
          {(user?.role === 'admin' || (item.postStatus || item.poststatus) !== 'posted') && (
            <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline">حذف</button>
          )}
        </div>
      )
    }
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة المرتجعات</h1>
          <p className="page-subtitle">تسجيل مرتجعات الموردين والعملاء</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="سجل المرتجعات" 
          columns={columns} 
          data={returns}
          actions={
            <button className="btn btn-primary" onClick={() => {
              setFormData({
                type: 'supplier',
                entityId: '',
                entityName: '',
                date: new Date().toISOString().split('T')[0],
                reason: '',
                items: [{ productId: '', qty: 1, price: 0 }]
              });
              setIsModalOpen(true);
            }}>
              + إنشاء مرتج جديد
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إنشاء مرتج جديد"
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">نوع المرتج</label>
            <select 
              className="form-select"
              value={formData.type} 
              onChange={e => setFormData({...formData, type: e.target.value, entityId: '', entityName: ''})}
            >
              <option value="supplier">مرتج مورد (إرجاع للمورد)</option>
              <option value="customer">مرتج عميل (إرجاع من العميل)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">الطرف المسترجع</label>
            <input 
              type="text" 
              className="form-input" 
              placeholder="اكتب اسم الطرف المسترجع"
              value={formData.entityName} 
              onChange={e => setFormData({...formData, entityName: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">التاريخ</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div style={{ marginTop: '20px', marginBottom: '10px' }}>
            <h4 style={{ marginBottom: '10px' }}>المنتجات</h4>
            {formData.items.map((item, index) => (
              <div key={index} className="form-row" style={{ marginBottom: '10px', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">المنتج</label>
                  <select 
                    className="form-select"
                    value={item.productId} 
                    onChange={e => updateItem(index, 'productId', e.target.value)}
                    required
                  >
                    <option value="">-- اختر المنتج --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} - {formatCurrency(formData.type === 'supplier' ? p.purchasePrice : p.sellPrice)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">الكمية</label>
                  <input 
                    type="number" 
                    min="1"
                    className="form-input" 
                    value={item.qty} 
                    onChange={e => updateItem(index, 'qty', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">السعر</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="form-input" 
                    value={item.price} 
                    onChange={e => updateItem(index, 'price', e.target.value)}
                    required
                  />
                </div>
                {formData.items.length > 1 && (
                  <button type="button" className="btn btn-danger" onClick={() => removeItem(index)}>×</button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-secondary" onClick={addItem} style={{ marginTop: '10px' }}>
              + إضافة منتج
            </button>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">سبب المرتج</label>
            <textarea 
              className="form-textarea" 
              value={formData.reason} 
              onChange={e => setFormData({...formData, reason: e.target.value})}
              placeholder="اكتب سبب المرتج..."
              required
            ></textarea>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span>الإجمالي النهائي:</span>
              <span style={{ color: 'var(--primary)' }}>{formatCurrency(calculateTotal())}</span>
            </div>
            {formData.type === 'supplier' && (
              <p style={{ marginTop: '10px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                تنبيه: سيتم خصم الكميات من المخزون تلقائياً
              </p>
            )}
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ المرتج</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
