'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    fullName: '',
    role: 'rep',
    active: true
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({
      username: '',
      password: '',
      fullName: '',
      role: 'rep',
      active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      username: user.username,
      password: '', // Blank for security, only update if changed
      fullName: user.fullName,
      role: user.role,
      active: user.active === 1
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const method = editingUser ? 'PUT' : 'POST';
      const res = await fetch('/api/users', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      alert('خطأ في الاتصال');
    }
  };

  const columns = [
    { header: 'الاسم', accessor: 'fullName' },
    { header: 'اسم المستخدم', accessor: 'username' },
    { 
      header: 'الصلاحية', 
      accessor: 'role',
      render: (row) => (
        <span className={`badge ${row.role === 'admin' ? 'badge-danger' : row.role === 'accountant' ? 'badge-success' : 'badge-info'}`}>
          {row.role === 'admin' ? 'مدير' : row.role === 'accountant' ? 'محاسب' : 'مندوب'}
        </span>
      )
    },
    { 
      header: 'الحالة', 
      accessor: 'active',
      render: (row) => (
        <span className={`badge ${row.active ? 'badge-success' : 'badge-danger'}`}>
          {row.active ? 'نشط' : 'غير نشط'}
        </span>
      )
    },
    { 
      header: 'تاريخ الإضافة', 
      accessor: 'createdAt',
      render: (row) => new Date(row.createdAt).toLocaleDateString('ar-EG')
    },
    {
      header: 'إجراءات',
      render: (row) => (
        <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(row)}>تعديل</button>
      )
    }
  ];

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إدارة المستخدمين</h1>
          <p className="page-subtitle">إضافة وتعديل صلاحيات النظام</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <DataTable 
          title="قائمة المستخدمين" 
          columns={columns} 
          data={users}
          actions={
            <button className="btn btn-primary" onClick={openAddModal}>
              + إضافة مستخدم
            </button>
          }
        />
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title={editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">الاسم الكامل</label>
            <input 
              type="text" 
              className="form-input" 
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">اسم المستخدم</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.username} 
                onChange={e => setFormData({...formData, username: e.target.value})}
                required
                disabled={!!editingUser}
                dir="ltr"
              />
            </div>
            <div className="form-group">
              <label className="form-label">{editingUser ? 'كلمة المرور (اتركها فارغة لعدم التغيير)' : 'كلمة المرور'}</label>
              <input 
                type="password" 
                className="form-input" 
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                required={!editingUser}
                dir="ltr"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">الصلاحية</label>
              <select 
                className="form-select"
                value={formData.role} 
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="admin">مدير النظام</option>
                <option value="accountant">محاسب</option>
                <option value="rep">مندوب مبيعات</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">حالة الحساب</label>
              <select 
                className="form-select"
                value={formData.active ? '1' : '0'} 
                onChange={e => setFormData({...formData, active: e.target.value === '1'})}
              >
                <option value="1">نشط</option>
                <option value="0">غير نشط (موقوف)</option>
              </select>
            </div>
          </div>
          
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>إلغاء</button>
            <button type="submit" className="btn btn-primary">حفظ البيانات</button>
          </div>
        </form>
      </Modal>
    </AuthGuard>
  );
}
