'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import PostStatusBadge from '@/components/PostStatusBadge';
import PostActions from '@/components/PostActions';
import { formatCurrency } from '@/lib/currency';
import { withUser } from '@/lib/api-client';

export default function Damaged() {
  const [damaged, setDamaged] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    productId: '',
    qty: 1,
    date: new Date().toISOString().split('T')[0],
    type: 'تالف',
    reason: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dmgRes, prodRes] = await Promise.all([
        fetch('/api/damaged'),
        fetch('/api/products')
      ]);
      
      const dmgData = await dmgRes.json();
      const prodData = await prodRes.json();
      
      setDamaged(dmgData.damaged || []);
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
    
    try {
      const res = await fetch('/api/damaged', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withUser({
          ...formData,
          productName: product ? product.name : '',
          qty: parseInt(formData.qty),
          value: product ? product.purchasePrice * parseInt(formData.qty) : 0
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

  const columns = [
    { header: 'التاريخ', accessor: 'date' },
    { header: 'المنتج', accessor: 'productName' },
    { header: 'الكمية', accessor: 'qty', render: (row) => <span style={{fontWeight: 'bold', color: 'var(--danger)'}}>-{row.qty}</span> },
    { 
      header: 'النوع', 
      accessor: 'type',
      render: (row) => (
        <span className={`badge ${row.type === 'منتهي الصلاحية' ? 'badge-warning' : 'badge-danger'}`}>
          {row.type}
        </span>
      )
    },
    { header: 'السبب الموثق', accessor: 'reason' },
    { header: 'قيمة الخسارة', accessor: 'value', render: (row) => <span>{formatCurrency(row.value)}</span> },
    { header: 'الترحيل', render: (row) => <PostStatusBadge record={row} /> },
    { header: 'إجراءات', render: (row) => <PostActions entity="damaged" record={row} onPosted={fetchData} /> },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">المواد التالفة والمفقودة</h1>
          <p className="page-subtitle">تسجيل المفقودات والتوالف وتأثيرها على المخزون</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="سجل التوالف والمفقودات" 
          columns={columns} 
          data={damaged}
          actions={
            <button className="btn btn-danger" onClick={() => {
              setFormData({
                productId: '',
                qty: 1,
                date: new Date().toISOString().split('T')[0],
                type: 'تالف',
                reason: ''
              });
              setIsModalOpen(true);
            }}>
              + تسجيل مادة تالفة
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="تسجيل مادة تالفة / مفقودة"
      >
        <div className="alert alert-warning">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{width: '20px', height: '20px'}}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          تنبيه: سيتم خصم هذه الكمية من رصيد المخزن الفعلي فوراً!
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">المنتج (اختر من المخزون)</label>
            <select 
              className="form-select"
              value={formData.productId} 
              onChange={e => setFormData({...formData, productId: e.target.value})}
              required
            >
              <option value="">-- اختر المنتج --</option>
              {products.map(p => (
                <option key={p.id} value={p.id} disabled={p.qty <= 0}>
                  {p.name} {p.qty <= 0 ? '(نفد من المخزن)' : `(متوفر: ${p.qty})`}
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الكمية التالفة/المفقودة</label>
              <input 
                type="number" 
                min="1"
                className="form-input" 
                value={formData.qty} 
                onChange={e => setFormData({...formData, qty: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">نوع السجل</label>
              <select 
                className="form-select"
                value={formData.type} 
                onChange={e => setFormData({...formData, type: e.target.value})}
              >
                <option value="تالف">تالف / مكسور</option>
                <option value="منتهي الصلاحية">منتهي الصلاحية</option>
                <option value="مفقود">مفقود (عجز غير مبرر)</option>
              </select>
            </div>
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
          
          <div className="form-group">
            <label className="form-label">السبب والتوثيق (إلزامي)</label>
            <textarea 
              className="form-textarea" 
              value={formData.reason} 
              onChange={e => setFormData({...formData, reason: e.target.value})}
              placeholder="وثق هنا سبب التلف أو الفقدان..."
              required
            ></textarea>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-danger">تسجيل وتحديث المخزون</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
