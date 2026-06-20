'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import PostStatusBadge from '@/components/PostStatusBadge';
import PostActions from '@/components/PostActions';
import { formatCurrency } from '@/lib/currency';
import { withUser } from '@/lib/api-client';
import { Printer } from 'lucide-react';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [user, setUser] = useState(null);
  
  const [formData, setFormData] = useState({
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
    const load = async () => {
      const storedUser = localStorage.getItem('erp_user');
      if (storedUser) setUser(JSON.parse(storedUser));
      await fetchData();
    };

    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withUser({
          ...formData,
          amount: parseFloat(formData.amount),
          repId: user?.id,
          repName: user?.fullName
        }))
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
    { header: 'المبلغ', accessor: 'amount', render: (row) => <span style={{fontWeight: 'bold', color: 'var(--success)'}}>{formatCurrency(row.amount)}</span> },
    { header: 'الترحيل', render: (row) => <PostStatusBadge record={row} /> },
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
    { header: 'ملاحظات', accessor: 'notes' },
    { 
      header: 'إجراءات', 
      render: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setSelectedCollection(row);
              setIsModalOpen(true);
            }}
            className="p-1 text-green-600 hover:bg-green-100 rounded"
            title="طباعة السند"
          >
            <Printer size={18} />
          </button>
          <PostActions entity="collections" record={row} onPosted={fetchData} />
        </div>
      )
    },
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
                amount: '',
                date: new Date().toISOString().split('T')[0],
                method: 'cash',
                notes: ''
              });
              setSelectedCollection(null);
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
        title={selectedCollection ? 'طباعة سند القبض' : 'إنشاء سند قبض جديد'}
      >
        {selectedCollection ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">رقم السند</p>
                <p className="font-bold text-gray-900">{selectedCollection.id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">التاريخ</p>
                <p className="font-bold text-gray-900">{selectedCollection.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">المبلغ</p>
                <p className="font-bold text-green-600">{formatCurrency(selectedCollection.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">طريقة الدفع</p>
                <p className="font-bold text-gray-900">
                  {selectedCollection.method === 'cash' ? 'نقدي' : selectedCollection.method === 'transfer' ? 'حوالة بنكية' : 'شيك'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">المندوب</p>
                <p className="font-bold text-gray-900">{selectedCollection.repName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">حالة الترحيل</p>
                <PostStatusBadge record={selectedCollection} />
              </div>
            </div>
            {selectedCollection.notes && (
              <div>
                <p className="text-sm text-gray-600">ملاحظات</p>
                <p className="font-bold text-gray-900">{selectedCollection.notes}</p>
              </div>
            )}
            <div className="flex gap-3 pt-4">
              <button 
                type="button" 
                onClick={() => window.print()} 
                className="btn-primary flex-1"
              >
                طباعة
              </button>
              <button type="button" onClick={() => { setIsModalOpen(false); setSelectedCollection(null); }} className="btn-secondary flex-1">
                إغلاق
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">المبلغ المحصل (د.ع)</label>
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
        )}
      </Modal>
    </AuthGuard>
  );
}
