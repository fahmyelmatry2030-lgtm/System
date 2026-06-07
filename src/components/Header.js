'use client';

import { Menu, User, Bell, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ROLE_LABELS = {
  admin: 'مدير النظام',
  accountant: 'محاسب',
  rep: 'مندوب مبيعات',
};

export default function Header({ user }) {
  const router = useRouter();
  const [dateStr, setDateStr] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateStr(new Date().toLocaleString('ar-IQ', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const loadPending = () => {
      fetch('/api/pending')
        .then((res) => res.json())
        .then((data) => setPendingCount(data.totalCount || 0))
        .catch(() => setPendingCount(0));
    };

    loadPending();
    window.addEventListener('pending-updated', loadPending);
    const interval = setInterval(loadPending, 30000);
    return () => {
      window.removeEventListener('pending-updated', loadPending);
      clearInterval(interval);
    };
  }, [user?.role]);

  const handleLogout = () => {
    localStorage.removeItem('erp_user');
    router.push('/');
  };

  return (
    <header className="h-[76px] flex items-center justify-between px-8 bg-[#f8f9fd] sticky top-0 z-10 w-full">
      <button className="p-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 px-5 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm text-sm font-semibold tracking-wide">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
        {dateStr || '...'}
      </div>

      <div className="flex items-center gap-3">
        {user?.role === 'admin' && (
          <Link
            href="/pending"
            className="relative p-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 text-gray-500 hover:text-orange-600 transition-colors"
            title="عمليات بانتظار الترحيل"
          >
            <Bell size={20} />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </Link>
        )}

        <div className="flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100">
          <div className="flex flex-col text-right">
            <span className="text-sm font-bold text-gray-800">{user?.fullName || 'مستخدم'}</span>
            <span className="text-[10px] text-gray-400">{ROLE_LABELS[user?.role] || ''}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600">
            <User size={18} />
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="p-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 text-gray-500 hover:text-red-500 transition-colors"
          title="تسجيل الخروج"
        >
          <LogOut size={20} />
        </button>
      </div>
    </header>
  );
}
