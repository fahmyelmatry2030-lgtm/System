'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import PostStatusBadge from '@/components/PostStatusBadge';
import PostActions from '@/components/PostActions';
import { formatCurrency } from '@/lib/currency';
import { getStoredUser } from '@/lib/api-client';
import { formatIraqDate } from '@/lib/date-utils';
import { Printer } from 'lucide-react';

export default function Collections() {
  const [collections, setCollections] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [printingCollection, setPrintingCollection] = useState(null);
  const [user, setUser] = useState(null);
  const [recipientError, setRecipientError] = useState('');
  
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
    const load = async () => {
      setUser(getStoredUser());
      await fetchData();
    };

    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setRecipientError('');

    if (!formData.customerId) {
      setRecipientError('⚠️ يرجى اختيار العميل');
      return;
    }
    
    try {
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        repId: user?.id,
        repName: user?.fullName || 'غير معروف',
        postStatus: 'pending'
      };

      const res = await fetch('/api/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        resetForm();
        fetchData();
        alert('✅ تم حفظ سند القبض بنجاح');
      } else {
        alert('❌ خطأ: فشل حفظ السند');
      }
    } catch (error) {
      console.error(error);
      alert('❌ خطأ في الاتصال: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      method: 'cash',
      notes: ''
    });
    setRecipientError('');
  };

  const columns = [
    { header: '#', render: (_, idx) => idx + 1 },
    { header: '📅 التاريخ', accessor: 'date', render: (row) => formatIraqDate(row.date) },
    { header: '👤 المتلقي', accessor: 'customerName', render: (row) => row.customerName || row.recipientName || '—' },
    { header: '💵 المبلغ', accessor: 'amount', render: (row) => <span className="font-bold text-green-600">{formatCurrency(row.amount)}</span> },
    { 
      header: '💳 الطريقة', 
      accessor: 'method',
      render: (row) => {
        const methods = {
          'cash': '💰 نقدي',
          'transfer': '🏦 حوالة بنكية',
          'check': '📄 شيك'
        };
        return methods[row.method] || row.method;
      }
    },
    { header: '👨‍💼 المندوب', accessor: 'repName', render: (row) => row.repName || '—' },
    { header: '📝 ملاحظات', accessor: 'notes', render: (row) => row.notes || '-' },
    { header: '📌 الحالة', render: (row) => <PostStatusBadge record={row} /> },
    { 
      header: '⚙️ الإجراءات', 
      render: (row) => (
        <div className="flex gap-2">
          <button 
            onClick={() => setPrintingCollection(row)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="طباعة"
          >
            🖨️ طباعة
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
          <h1 className="page-title">📄 سندات القبض والتحصيلات</h1>
          <p className="page-subtitle">تسجيل المبالغ المحصلة من العملاء والموردين</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2" 
          onClick={() => {
            resetForm();
            setPrintingCollection(null);
            setIsModalOpen(true);
          }}
        >
          ➕ سند قبض جديد
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
        </div>
      ) : (
        <DataTable 
          title="📊 سجل التحصيلات" 
          columns={columns} 
          data={collections}
          emptyMessage="📭 لا توجد سندات قبض مسجلة"
        />
      )}

      {/* Modal للإنشاء */}
      <Modal 
        isOpen={isModalOpen && !printingCollection} 
        onClose={() => { setIsModalOpen(false); resetForm(); }} 
        title="➕ سند قبض جديد"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* اختيار المتلقي */}
          <div>
            <label className="form-label">👤 اسم المتلقي (العميل)</label>
            <select 
              value={formData.customerId}
              onChange={(e) => {
                const selectedCust = customers.find(c => c.id === e.target.value);
                setFormData({ 
                  ...formData, 
                  customerId: e.target.value,
                  customerName: selectedCust ? selectedCust.name : ''
                });
                setRecipientError('');
              }}
              className={`form-select border-2 transition-colors ${
                recipientError ? 'border-red-500 bg-red-50' : 'border-gray-300 focus:border-blue-500'
              }`}
              required
            >
              <option value="">اختر العميل...</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {recipientError && <p className="text-red-600 text-sm mt-1 font-semibold">{recipientError}</p>}
          </div>

          {/* المبلغ */}
          <div>
            <label className="form-label">💵 المبلغ المحصل (د.ع)</label>
            <input 
              type="number" 
              step="0.01"
              min="0.1"
              required
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="form-input border-2"
            />
          </div>

          {/* التاريخ */}
          <div>
            <label className="form-label">📅 تاريخ التحصيل</label>
            <input 
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="form-input border-2"
            />
          </div>

          {/* طريقة الدفع */}
          <div>
            <label className="form-label">💳 طريقة الدفع</label>
            <select 
              value={formData.method}
              onChange={(e) => setFormData({ ...formData, method: e.target.value })}
              className="form-input border-2"
            >
              <option value="cash">💰 نقدي</option>
              <option value="transfer">🏦 حوالة بنكية</option>
              <option value="check">📄 شيك</option>
            </select>
          </div>

          {/* ملاحظات */}
          <div>
            <label className="form-label">📝 ملاحظات والتفاصيل</label>
            <textarea 
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="مثال: تحصيل عن الفاتورة رقم X، أو رقم الحوالة..."
              rows="3"
              className="form-input border-2"
            />
          </div>

          {/* الأزرار */}
          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              className="btn btn-primary flex-1"
            >
              💾 حفظ السند
            </button>
            <button 
              type="button" 
              onClick={() => { setIsModalOpen(false); resetForm(); }} 
              className="btn btn-secondary flex-1"
            >
              ❌ إلغاء
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal للطباعة */}
      {printingCollection && (
        <Modal 
          isOpen={true} 
          onClose={() => setPrintingCollection(null)} 
          title={`🖨️ طباعة سند القبض #${printingCollection.id}`}
        >
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            {/* البيانات الرئيسية */}
            <div className="border-b-2 pb-4 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-600">رقم السند</p>
                <p className="text-lg font-bold text-blue-600">#{printingCollection.id}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">التاريخ</p>
                <p className="text-lg font-bold">{formatIraqDate(printingCollection.date)}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">المندوب</p>
                <p className="text-sm font-bold">{printingCollection.repName || '—'}</p>
              </div>
            </div>

            {/* بيانات التحصيل */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">المتلقي:</span>
                <span className="text-sm font-bold">{printingCollection.customerName || printingCollection.recipientName || '—'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">المبلغ المحصل:</span>
                <span className="text-xl font-bold text-green-600">{formatCurrency(printingCollection.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">طريقة الدفع:</span>
                <span className="text-sm font-bold">
                  {printingCollection.method === 'cash' ? '💰 نقدي' : 
                   printingCollection.method === 'transfer' ? '🏦 حوالة بنكية' : 
                   '📄 شيك'}
                </span>
              </div>
            </div>

            {/* الملاحظات */}
            {printingCollection.notes && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">📝 الملاحظات:</p>
                <p className="text-sm text-gray-600 bg-gray-100 p-3 rounded-lg">{printingCollection.notes}</p>
              </div>
            )}

            {/* حالة الترحيل */}
            <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-600">
              <p className="text-sm text-gray-700 mb-2">📌 حالة الترحيل:</p>
              <PostStatusBadge record={printingCollection} />
            </div>

            {/* أزرار الطباعة */}
            <div className="flex gap-3 pt-4">
              <button 
                onClick={() => window.print()} 
                className="btn btn-primary flex-1"
              >
                🖨️ طباعة
              </button>
              <button 
                onClick={() => setPrintingCollection(null)} 
                className="btn btn-secondary flex-1"
              >
                ❌ إغلاق
              </button>
            </div>
          </div>
        </Modal>
      )}
    </AuthGuard>
  );
}
