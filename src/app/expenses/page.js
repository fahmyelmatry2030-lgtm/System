'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import PostStatusBadge from '@/components/PostStatusBadge';
import PostActions from '@/components/PostActions';
import { formatCurrency } from '@/lib/currency';
import { withUser } from '@/lib/api-client';

export default function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    category: 'تشغيلية',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/expenses');
      const data = await res.json();
      setExpenses(data.expenses || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchExpenses();
    };

    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withUser({
          ...formData,
          amount: parseFloat(formData.amount)
        }))
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchExpenses();
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    }
  };

  const columns = [
    { header: 'الرقم', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date' },
    { 
      header: 'الفئة', 
      accessor: 'category',
      render: (row) => (
        <span className={`badge ${row.category === 'إيجارات' ? 'badge-purple' : row.category === 'مرتبات' ? 'badge-info' : 'badge-warning'}`}>
          {row.category}
        </span>
      )
    },
    { header: 'المبلغ', accessor: 'amount', render: (row) => <span style={{fontWeight: 'bold'}}>{formatCurrency(row.amount)}</span> },
    { header: 'الترحيل', render: (row) => <PostStatusBadge record={row} /> },
    { header: 'البيان', accessor: 'description' },
    { header: 'إجراءات', render: (row) => <PostActions entity="expenses" record={row} onPosted={fetchExpenses} /> },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة المصروفات</h1>
          <p className="page-subtitle">تسجيل ومتابعة المصروفات التشغيلية للمؤسسة</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="سجل المصروفات" 
          columns={columns} 
          data={expenses}
          actions={
            <button className="btn btn-primary" onClick={() => {
              setFormData({
                category: 'تشغيلية',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                description: ''
              });
              setIsModalOpen(true);
            }}>
              + إضافة مصروف جديد
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="تسجيل مصروف جديد"
      >
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الفئة</label>
              <select 
                className="form-select"
                value={formData.category} 
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="تشغيلية">تشغيلية (كهرباء، ماء، صيانة)</option>
                <option value="مرتبات">مرتبات</option>
                <option value="إيجارات">إيجارات</option>
                <option value="نثريات">نثريات متنوعة</option>
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
          </div>
          
          <div className="form-group">
            <label className="form-label">المبلغ (د.ع)</label>
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
            <label className="form-label">البيان والتفاصيل</label>
            <textarea 
              className="form-textarea" 
              value={formData.description} 
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="اكتب تفاصيل المصروف هنا..."
            ></textarea>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ المصروف</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
