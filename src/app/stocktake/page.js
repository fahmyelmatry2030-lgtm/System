'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import PostStatusBadge from '@/components/PostStatusBadge';
import PostActions from '@/components/PostActions';
import { withUser } from '@/lib/api-client';

export default function Stocktake() {
  const [stocktakes, setStocktakes] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    physicalQty: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    adjustInventory: true
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stkRes, prodRes] = await Promise.all([
        fetch('/api/stocktake'),
        fetch('/api/products')
      ]);
      
      const stkData = await stkRes.json();
      const prodData = await prodRes.json();
      
      setStocktakes(stkData.stocktakes || []);
      setProducts(prodData.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    const physicalQty = parseInt(formData.physicalQty);
    const difference = physicalQty - product.qty;
    const status = difference === 0 ? 'مطابق' : difference > 0 ? 'زيادة' : 'عجز';
    
    try {
      const res = await fetch('/api/stocktake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withUser({
          ...formData,
          productName: product.name,
          systemQty: product.qty,
          physicalQty,
          difference,
          status
        }))
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData(); // Refresh both lists
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    }
  };

  const columns = [
    { header: 'التاريخ', accessor: 'date' },
    { header: 'المنتج', accessor: 'productName' },
    { header: 'الرصيد الدفتري', accessor: 'systemQty' },
    { header: 'الجرد الفعلي', accessor: 'physicalQty' },
    { 
      header: 'الفرق', 
      accessor: 'difference',
      render: (row) => (
        <span style={{
          fontWeight: 'bold', 
          color: row.difference === 0 ? 'var(--success)' : row.difference > 0 ? 'var(--info)' : 'var(--danger)'
        }}>
          {row.difference > 0 ? '+' : ''}{row.difference}
        </span>
      )
    },
    { 
      header: 'الحالة', 
      accessor: 'status',
      render: (row) => (
        <span className={`badge ${row.status === 'مطابق' ? 'badge-success' : row.status === 'زيادة' ? 'badge-info' : 'badge-danger'}`}>
          {row.status}
        </span>
      )
    },
    { header: 'ملاحظات', accessor: 'notes' },
    { header: 'الترحيل', render: (row) => <PostStatusBadge record={row} /> },
    { header: 'إجراءات', render: (row) => <PostActions entity="stocktakes" record={row} onPosted={fetchData} /> },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">جرد المخزون</h1>
          <p className="page-subtitle">مطابقة الرصيد الدفتري مع الجرد الفعلي للمستودع</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="سجل الجرد" 
          columns={columns} 
          data={stocktakes}
          actions={
            <button className="btn btn-primary" onClick={() => {
              setFormData({
                productId: '',
                physicalQty: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                adjustInventory: true
              });
              setIsModalOpen(true);
            }}>
              + جرد صنف جديد
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="جرد ومطابقة صنف"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">المنتج</label>
            <select 
              className="form-select"
              value={formData.productId} 
              onChange={e => setFormData({...formData, productId: e.target.value})}
              required
            >
              <option value="">-- اختر المنتج --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (الرصيد الدفتري: {p.qty})</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الكمية الفعلية بالمستودع</label>
              <input 
                type="number" 
                min="0"
                className="form-input" 
                value={formData.physicalQty} 
                onChange={e => setFormData({...formData, physicalQty: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">تاريخ الجرد</label>
              <input 
                type="date" 
                className="form-input" 
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
            <input 
              type="checkbox" 
              id="adjustInv" 
              checked={formData.adjustInventory}
              onChange={e => setFormData({...formData, adjustInventory: e.target.checked})}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="adjustInv" style={{ fontSize: '0.85rem', cursor: 'pointer' }}>تعديل رصيد المخزون بناءً على نتيجة الجرد (تسوية المخزون)</label>
          </div>
          
          <div className="form-group" style={{ marginTop: '16px' }}>
            <label className="form-label">ملاحظات</label>
            <textarea 
              className="form-textarea" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="سجل أي ملاحظات أو أسباب للفروقات..."
            ></textarea>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ واعتماد الجرد</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
