'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    supplierId: '',
    supplierName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productId: '', qty: 1, price: 0 }],
    paidAmount: 0,
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [purRes, supRes, prodRes] = await Promise.all([
        fetch('/api/purchases'),
        fetch('/api/suppliers'),
        fetch('/api/products')
      ]);
      
      const purData = await purRes.json();
      const supData = await supRes.json();
      const prodData = await prodRes.json();
      
      setPurchases(purData.purchases || []);
      setSuppliers(supData.suppliers || []);
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
        newItems[index].price = product.purchasePrice;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const supplier = suppliers.find(s => s.id === formData.supplierId);
    const total = calculateTotal();
    
    try {
      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          supplierName: supplier ? supplier.name : '',
          total,
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
        })
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
    { header: 'رقم الفاتورة', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'المورد', accessor: 'supplierName' },
    { 
      header: 'الإجمالي', 
      accessor: 'total',
      render: (row) => <span style={{fontWeight: 'bold'}}>{row.total} ﷼</span>
    },
    { header: 'المدفوع', accessor: 'paidAmount', render: (row) => `${row.paidAmount} ﷼` },
    { header: 'المتبقي', accessor: (row) => `${row.total - row.paidAmount} ﷼` },
    { header: 'ملاحظات', accessor: 'notes' }
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة المشتريات</h1>
          <p className="page-subtitle">إنشاء ومتابعة فواتير الشراء وإضافة المنتجات للمخزون</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="سجل فواتير الشراء" 
          columns={columns} 
          data={purchases}
          actions={
            <button className="btn btn-primary" onClick={() => {
              setFormData({
                supplierId: '',
                supplierName: '',
                date: new Date().toISOString().split('T')[0],
                items: [{ productId: '', qty: 1, price: 0 }],
                paidAmount: 0,
                notes: ''
              });
              setIsModalOpen(true);
            }}>
              + إنشاء فاتورة شراء
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إنشاء فاتورة شراء جديدة"
        size="large"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">المورد</label>
            <select 
              className="form-select"
              value={formData.supplierId} 
              onChange={e => setFormData({...formData, supplierId: e.target.value})}
              required
            >
              <option value="">-- اختر المورد --</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name} (الرصيد: {s.balance} ﷼)</option>
              ))}
            </select>
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
                        {p.name} - {p.purchasePrice} ﷼
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
                  <label className="form-label">سعر الشراء</label>
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
            <label className="form-label">المبلغ المدفوع (﷼)</label>
            <input 
              type="number" 
              step="0.01"
              min="0"
              className="form-input" 
              value={formData.paidAmount} 
              onChange={e => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span>الإجمالي النهائي:</span>
              <span style={{ color: 'var(--primary)' }}>{calculateTotal()} ﷼</span>
            </div>
          </div>
          
          <div className="form-group" style={{ marginTop: '20px' }}>
            <label className="form-label">ملاحظات</label>
            <textarea 
              className="form-textarea" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="أي ملاحظات إضافية..."
            ></textarea>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ الفاتورة وإضافة للمخزون</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
