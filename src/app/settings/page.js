'use client';

import { useState, useEffect } from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    taxRate: 0,
    currency: 'د.ع',
    logoUrl: '',
    footerMessage: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/settings');
        const data = await res.json();
        if (data.settings) {
          setFormData({
            companyName: data.settings.companyname || '',
            taxRate: data.settings.taxrate || 0,
            currency: data.settings.currency || 'د.ع',
            logoUrl: data.settings.logourl || '',
            footerMessage: data.settings.footermessage || ''
          });
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('تم حفظ الإعدادات بنجاح!');
        // Update local storage so other components can use it immediately without refetching
        localStorage.setItem('erp_settings', JSON.stringify(formData));
        window.dispatchEvent(new Event('settingsUpdated'));
      } else {
        alert('حدث خطأ أثناء الحفظ');
      }
    } catch (err) {
      alert('خطأ في الاتصال');
    }
    setSaving(false);
  };

  return (
    <AuthGuard allowedRoles={['admin']}>
      <div className="page-header animate-slide">
        <div>
          <h1 className="page-title">إعدادات النظام</h1>
          <p className="page-subtitle">تكوين البيانات الأساسية للشركة والفواتير</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner"></div></div>
      ) : (
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 max-w-3xl animate-slide">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label font-bold text-gray-700">اسم الشركة</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.companyName} 
                onChange={e => setFormData({...formData, companyName: e.target.value})}
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label font-bold text-gray-700">الضريبة المضافة (%)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-input" 
                  value={formData.taxRate} 
                  onChange={e => setFormData({...formData, taxRate: parseFloat(e.target.value) || 0})}
                />
              </div>
              <div className="form-group">
                <label className="form-label font-bold text-gray-700">العملة الافتراضية</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formData.currency} 
                  onChange={e => setFormData({...formData, currency: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-gray-700">رابط الشعار (Logo URL)</label>
              <input 
                type="text" 
                className="form-input" 
                value={formData.logoUrl} 
                onChange={e => setFormData({...formData, logoUrl: e.target.value})}
                placeholder="https://example.com/logo.png"
              />
              {formData.logoUrl && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100 inline-block">
                  <p className="text-sm text-gray-500 mb-2">معاينة الشعار:</p>
                  <img src={formData.logoUrl} alt="Logo Preview" className="h-16 object-contain" onError={(e) => e.target.style.display='none'} />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-gray-700">رسالة تذييل الفاتورة</label>
              <textarea 
                className="form-textarea h-24" 
                value={formData.footerMessage} 
                onChange={e => setFormData({...formData, footerMessage: e.target.value})}
                placeholder="شكراً لتعاملكم معنا..."
              ></textarea>
            </div>

            <div className="flex justify-end mt-8 pt-6 border-t border-gray-100">
              <button 
                type="submit" 
                className="btn btn-primary px-8 py-3 text-lg"
                disabled={saving}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
              </button>
            </div>
          </form>
        </div>
      )}
    </AuthGuard>
  );
}
