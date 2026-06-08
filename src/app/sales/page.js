'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import PostStatusBadge from '@/components/PostStatusBadge';
import PostActions from '@/components/PostActions';
import PrintInvoice from '@/components/PrintInvoice';
import { formatCurrency } from '@/lib/currency';
import { withUser } from '@/lib/api-client';

export default function SalesPage() {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [printingRecord, setPrintingRecord] = useState(null);
  const [settings, setSettings] = useState({});
  
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productId: '', qty: 1, price: 0 }],
    discount: 0,
    paidAmount: 0,
    paymentStatus: 'unpaid',
    notes: ''
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [salesRes, custRes, prodRes] = await Promise.all([
        fetch('/api/sales'),
        fetch('/api/customers'),
        fetch('/api/products')
      ]);
      
      const salesData = await salesRes.json();
      const custData = await custRes.json();
      const prodData = await prodRes.json();
      
      setSales(salesData.sales || []);
      setCustomers(custData.customers || []);
      setProducts(prodData.products || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem('erp_user');
    if (storedUser) setUser(JSON.parse(storedUser));
    
    const storedSettings = localStorage.getItem('erp_settings');
    if (storedSettings) setSettings(JSON.parse(storedSettings));
    
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
        newItems[index].price = product.sellPrice;
      }
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotal = () => {
    return formData.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const customer = customers.find(c => c.id === formData.customerId);
    const total = calculateTotal();
    
    try {
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(withUser({
          ...formData,
          customerName: customer ? customer.name : '',
          total: total - formData.discount,
          repId: user?.id,
          repName: user?.fullName,
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

  const columns = [
    { header: 'رقم الفاتورة', accessor: 'id' },
    { header: 'التاريخ', accessor: 'date' },
    { header: 'العميل', accessor: 'customerName' },
    { header: 'المندوب', accessor: 'repName' },
    { 
      header: 'الإجمالي', 
      accessor: 'total',
      render: (row) => <span style={{fontWeight: 'bold'}}>{formatCurrency(row.total)}</span>
    },
    {
      header: 'الترحيل',
      render: (row) => <PostStatusBadge record={row} />,
    },
    { 
      header: 'الحالة', 
      accessor: 'paymentStatus',
      render: (row) => (
        <span className={`badge ${row.paymentStatus === 'paid' ? 'badge-success' : row.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger'}`}>
          {row.paymentStatus === 'paid' ? 'مدفوع' : row.paymentStatus === 'partial' ? 'مدفوع جزئياً' : 'غير مدفوع'}
        </span>
      )
    },
    { header: 'المبلغ المدفوع', accessor: 'paidAmount', render: (row) => formatCurrency(row.paidAmount) },
    { header: 'المتبقي', accessor: (row) => formatCurrency(row.total - row.paidAmount) },
    {
      header: 'إجراءات',
      render: (row) => (
        <div className="flex items-center gap-2">
          <PostActions entity="sales" record={row} onPosted={fetchData} />
          <button 
            className="btn btn-secondary text-xs px-2 py-1" 
            onClick={() => setPrintingRecord(row)}
            title="طباعة الفاتورة"
          >
            🖨️
          </button>
        </div>
      ),
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة المبيعات</h1>
          <p className="page-subtitle">إنشاء ومتابعة فواتير البيع والمبالغ المحصلة</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="سجل فواتير البيع" 
          columns={columns} 
          data={sales}
          actions={
            <button className="btn btn-primary" onClick={() => {
              setFormData({
                customerId: '',
                customerName: '',
                date: new Date().toISOString().split('T')[0],
                items: [{ productId: '', qty: 1, price: 0 }],
                discount: 0,
                paidAmount: 0,
                paymentStatus: 'unpaid',
                notes: ''
              });
              setIsModalOpen(true);
            }}>
              + إنشاء فاتورة بيع
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="إنشاء فاتورة بيع جديدة"
        size="large"
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
                <option key={c.id} value={c.id}>{c.name} (الرصيد: {formatCurrency(c.balance)})</option>
              ))}
            </select>
          </div>
          
          <div className="form-row">
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
              <label className="form-label">حالة الدفع</label>
              <select 
                className="form-select"
                value={formData.paymentStatus} 
                onChange={e => setFormData({...formData, paymentStatus: e.target.value})}
              >
                <option value="unpaid">غير مدفوع</option>
                <option value="partial">مدفوع جزئياً</option>
                <option value="paid">مدفوع بالكامل</option>
              </select>
            </div>
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
                      <option key={p.id} value={p.id} disabled={p.qty <= 0}>
                        {p.name} - {formatCurrency(p.sellPrice)} {p.qty <= 0 ? '(نفد)' : `(متوفر: ${p.qty})`}
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

          <div className="form-row" style={{ marginTop: '20px' }}>
            <div className="form-group">
              <label className="form-label">الخصم (د.ع)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="form-input" 
                value={formData.discount} 
                onChange={e => setFormData({...formData, discount: parseFloat(e.target.value) || 0})}
              />
            </div>
            <div className="form-group">
              <label className="form-label">المبلغ المدفوع (د.ع)</label>
              <input 
                type="number" 
                step="0.01"
                min="0"
                className="form-input" 
                value={formData.paidAmount} 
                onChange={e => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
              />
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: 'var(--bg-secondary)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>المجموع:</span>
              <span style={{ fontWeight: 'bold' }}>{formatCurrency(calculateTotal())}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>الخصم:</span>
              <span style={{ color: 'var(--danger)' }}>-{formatCurrency(formData.discount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 'bold', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
              <span>الإجمالي النهائي:</span>
              <span style={{ color: 'var(--primary)' }}>{formatCurrency(calculateTotal() - formData.discount)}</span>
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
            <button type="submit" className="btn btn-primary">حفظ الفاتورة</button>
          </div>
        </form>
      </Modal>

      {printingRecord && (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 overflow-y-auto">
          <div className="min-h-screen px-4 text-center">
            <div className="fixed inset-0" onClick={() => setPrintingRecord(null)}></div>
            <span className="inline-block h-screen align-middle" aria-hidden="true">&#8203;</span>
            <div className="inline-block w-full max-w-4xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl relative">
              <button 
                onClick={() => setPrintingRecord(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 print-hide"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <PrintInvoice record={printingRecord} type="sales" settings={settings} />
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}
