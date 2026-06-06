'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'cash',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [colRes, custRes] = await Promise.all([
        fetch('/api/collections'),
        fetch('/api/customers')
      ]);
      
      const colData = await colRes.json();
      const custData = await custRes.json();
      
      setCollections(colData.collections || []);
      setCustomers(custData.customers || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('erp_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Find customer name
    const customer = customers.find(c => c.id === formData.customerId);
    
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
          customerName: customer ? customer.name : '',
          repId: user?.id,
          repName: user?.fullName
        })
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchData();
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    }
  };

  const columns = [
    { header: 'الرقم', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'العميل', accessor: 'customerName' },
    { header: 'المبلغ', accessor: 'amount', render: (row) => <span style={{fontWeight: 'bold', color: 'var(--success)'}}>{row.amount} ﷼</span> },
    { 
      header: 'طريقة الدفع', 
      accessor: 'method',
      render: (row) => (
        <span className={`badge ${row.method === 'cash' ? 'badge-success' : 'badge-info'}`}>
          {row.method === 'cash' ? 'نقدي' : row.method === 'transfer' ? 'حوالة بنكية' : 'شيك'}
        </span>
      )
    },
    { header: 'المندوب', accessor: 'repName' },
    { header: 'ملاحظات', accessor: 'notes' }
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">سندات القبض والتحصيلات</h1>
          <p className="page-subtitle">تسجيل المبالغ المحصلة من العملاء</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="سجل التحصيلات" 
          columns={columns} 
          data={collections}
          actions={
            <button className="btn btn-primary" onClick={() => {
              setFormData({
                customerId: '',
                customerName: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                method: 'cash',
                notes: ''
              });
              setIsModalOpen(true);
            }}>
              + إضافة سند قبض
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إنشاء سند قبض جديد"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">العميل</label>
            <select 
              className="form-select"
              value={formData.customerId} 
              onChange={e => setFormData({...formData, customerId: e.target.value})}
              required
            >
              <option value="">-- اختر العميل --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.name} (رصيد المديونية: {c.balance} ﷼)</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">المبلغ المحصل (﷼)</label>
              <input 
                type="number" 
                step="0.01"
                min="0.1"
                className="form-input" 
                value={formData.amount} 
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">طريقة الدفع</label>
              <select 
                className="form-select"
                value={formData.method} 
                onChange={e => setFormData({...formData, method: e.target.value})}
              >
                <option value="cash">نقدي</option>
                <option value="transfer">حوالة بنكية</option>
                <option value="check">شيك</option>
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">تاريخ التحصيل</label>
            <input 
              type="date" 
              className="form-input" 
              value={formData.date} 
              onChange={e => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">ملاحظات والتفاصيل</label>
            <textarea 
              className="form-textarea" 
              value={formData.notes} 
              onChange={e => setFormData({...formData, notes: e.target.value})}
              placeholder="مثال: تحصيل عن الفاتورة رقم X، أو رقم الحوالة..."
            ></textarea>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ السند وتحديث الرصيد</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
