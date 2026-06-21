'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import { formatCurrency } from '@/lib/currency';

export default function CustomersPage() {
  const [data, setData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [statementOpen, setStatementOpen] = useState(false);
  const [statement, setStatement] = useState(null);
  const [statementLoading, setStatementLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const fetchData = async () => {
    try {
      const res = await fetch('/api/customers');
      const json = await res.json();
      setData(json.customers || json.data || json || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchData();
    };

    load();
  }, []);

  const handleAdd = () => {
    setEditingItem(null);
    setIsModalOpen(true);
    setNameError('');
    setPhoneError('');
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      try {
        await fetch(`/api/customers?id=${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStatement = async (customer) => {
    setStatementOpen(true);
    setStatementLoading(true);
    try {
      const res = await fetch(`/api/customers/statement?customerId=${customer.id}`);
      const json = await res.json();
      setStatement(json);
    } catch (err) {
      console.error(err);
    } finally {
      setStatementLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData);

    // Validate name uniqueness
    const existingCustomer = data.find(c => c.name === payload.name && c.id !== editingItem?.id);
    if (existingCustomer) {
      setNameError('اسم العميل مكرر');
      return;
    }

    // Validate phone number
    const phone = payload.phone.replace(/\s/g, '');
    if (phone.length !== 11 || !phone.startsWith('07')) {
      setPhoneError('رقم الموبايل يجب أن يكون 11 رقم ويبدأ بـ 07');
      return;
    }

    // Format phone number automatically
    payload.phone = phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');

    try {
      if (editingItem) {
        await fetch('/api/customers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, id: editingItem.id }),
        });
      } else {
        await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const columns = [
    { header: '#', render: (_, index) => index + 1 },
    { header: 'اسم العميل', accessor: 'name' },
    { header: 'رقم الهاتف', accessor: 'phone' },
    {
      header: 'الرصيد',
      accessor: 'balance',
      render: (row) => (
        <span style={{ fontWeight: 'bold', color: row.balance < 0 ? '#ef4444' : row.balance > 0 ? '#22c55e' : '#6b7280' }}>
          {formatCurrency(Math.abs(row.balance))}
        </span>
      ),
    },
    {
      header: 'تاريخ الإضافة',
      accessor: 'createdAt',
      render: (row) => {
        const date = new Date(row.createdAt);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('ar-EG');
      },
    },
    {
      header: 'إجراءات',
      render: (row) => {
        const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
        const isRep = user.role === 'rep';
        const isAccountant = user.role === 'accountant';
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleEdit(row)} 
              className={isRep ? 'text-gray-400 cursor-not-allowed' : 'text-blue-500 hover:underline'}
              disabled={isRep}
            >
              تعديل
            </button>
            <a href={`/customers/${row.id}`} className="text-green-600 hover:underline">كشف حساب</a>
            <button 
              onClick={() => handleDelete(row.id)} 
              className={isRep || isAccountant ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:underline'}
              disabled={isRep || isAccountant}
            >
              حذف
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <AuthGuard allowedRoles={['admin', 'accountant', 'rep']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة العملاء</h1>
          <p className="page-subtitle">إضافة وتعديل ومتابعة بيانات العملاء ومديونياتهم</p>
        </div>
      </div>

      <DataTable
        title="قائمة العملاء"
        columns={columns}
        data={data}
        actions={
          <button className="btn btn-primary" onClick={handleAdd}>
            + إضافة عميل
          </button>
        }
      />

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingItem ? 'تعديل عميل' : 'إضافة عميل جديد'}>
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div>
            <label className="form-label">اسم العميل</label>
            <input 
              name="name" 
              defaultValue={editingItem?.name || ''} 
              required 
              className={`form-input ${nameError ? 'border-red-500' : ''}`}
              onChange={() => setNameError('')}
            />
            {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="form-label">رقم الهاتف</label>
            <input 
              name="phone" 
              defaultValue={editingItem?.phone || ''} 
              className={`form-input ${phoneError ? 'border-red-500' : ''}`}
              onChange={(e) => {
                const value = e.target.value.replace(/\s/g, '');
                if (value.length <= 11) {
                  const formatted = value.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3');
                  e.target.value = formatted;
                }
                setPhoneError('');
              }}
            />
            {phoneError && <p className="text-red-500 text-sm mt-1">{phoneError}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={statementOpen} onClose={() => setStatementOpen(false)} title="كشف حساب العميل" size="large">
        {statementLoading ? (
          <div className="loading-spinner"><div className="spinner"></div></div>
        ) : statement ? (
          <div className="space-y-4">
            <div className="card" style={{ padding: '16px' }}>
              <h3 style={{ marginBottom: '8px' }}>{statement.customer.name}</h3>
              <p>المديونية الحالية: <strong>{formatCurrency(statement.summary.balance)}</strong></p>
              <p>إجمالي المبيعات المرحّلة: {formatCurrency(statement.summary.totalSales)}</p>
              <p>إجمالي التحصيلات المرحّلة: {formatCurrency(statement.summary.totalCollected)}</p>
            </div>

            <div>
              <h4 style={{ marginBottom: '10px' }}>فواتير البيع</h4>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>التاريخ</th>
                    <th>الإجمالي</th>
                    <th>المدفوع</th>
                    <th>المتبقي</th>
                    <th>الترحيل</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.sales.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.id}</td>
                      <td>{sale.date}</td>
                      <td>{formatCurrency(sale.total)}</td>
                      <td>{formatCurrency(sale.paidAmount || sale.paidamount || 0)}</td>
                      <td>{formatCurrency(sale.total - (sale.paidAmount || sale.paidamount || 0))}</td>
                      <td>{(sale.postStatus || sale.poststatus) === 'posted' ? 'مرحّل' : 'معلق'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h4 style={{ marginBottom: '10px' }}>سندات القبض</h4>
              <table>
                <thead>
                  <tr>
                    <th>الرقم</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الترحيل</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.collections.map((col) => (
                    <tr key={col.id}>
                      <td>{col.id}</td>
                      <td>{col.date}</td>
                      <td>{formatCurrency(col.amount)}</td>
                      <td>{(col.postStatus || col.poststatus) === 'posted' ? 'مرحّل' : 'معلق'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>
    </AuthGuard>
  );
}
