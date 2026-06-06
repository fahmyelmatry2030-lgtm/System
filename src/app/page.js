'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        // Save user to localStorage
        localStorage.setItem('erp_user', JSON.stringify(data.user));
        router.push('/dashboard');
      } else {
        setError(data.error || 'فشل تسجيل الدخول');
      }
    } catch (err) {
      setError('حدث خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  // Helper for quick login testing
  const quickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="login-container">
      <Head>
        <title>تسجيل الدخول - نظام ERP</title>
      </Head>
      
      <div className="login-card animate-slide">
        <div className="login-logo">
          <h1>ERP System</h1>
          <p>نظام الإدارة المتكامل للمبيعات والمشتريات</p>
        </div>

        {error && (
          <div className="alert alert-danger">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{width: '20px', height: '20px'}}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">اسم المستخدم</label>
            <input 
              type="text" 
              className="form-input" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
              dir="ltr"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">كلمة المرور</label>
            <input 
              type="password" 
              className="form-input" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
              dir="ltr"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary login-btn" 
            disabled={loading}
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div style={{ marginTop: '30px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px', textAlign: 'center' }}>
            بيانات الدخول السريع (للتجربة):
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="badge badge-purple" style={{ border: 'none', cursor: 'pointer' }} onClick={() => quickLogin('admin', 'admin123')}>مدير النظام</button>
            <button className="badge badge-success" style={{ border: 'none', cursor: 'pointer' }} onClick={() => quickLogin('accountant', 'acc123')}>محاسب</button>
            <button className="badge badge-info" style={{ border: 'none', cursor: 'pointer' }} onClick={() => quickLogin('rep_ahmed', 'rep123')}>مندوب</button>
          </div>
        </div>
      </div>
    </div>
  );
}
