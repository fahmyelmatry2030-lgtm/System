'use client';

import { useState } from 'react';

export default function ProfileModal({ isOpen, onClose, user }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
      return;
    }

    if (newPassword.length < 4) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword
        })
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح! ✅' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.error || 'حدث خطأ' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'خطأ في الاتصال بالخادم' });
    }
    setSaving(false);
  };

  const roleLabels = {
    admin: 'مدير النظام',
    accountant: 'محاسب',
    rep: 'مندوب'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold mb-1">الملف الشخصي</h2>
              <p className="text-blue-100 text-sm">إعدادات الحساب وتغيير كلمة المرور</p>
            </div>
            <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {user?.fullName?.charAt(0) || '؟'}
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{user?.fullName}</h3>
              <p className="text-sm text-gray-500">@{user?.username}</p>
              <span className="inline-block mt-1 text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-bold">
                {roleLabels[user?.role] || user?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Password Change Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h4 className="font-bold text-gray-700 mb-2">تغيير كلمة المرور</h4>

          {message.text && (
            <div className={`p-3 rounded-xl text-sm font-bold ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">كلمة المرور الحالية</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">كلمة المرور الجديدة</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600 mb-1">تأكيد كلمة المرور الجديدة</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={4}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              type="submit" 
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
              disabled={saving}
            >
              {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button 
              type="button" 
              className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition-colors"
              onClick={onClose}
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
