'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard, Users, Package, ShoppingCart, ArrowDownLeft,
  DollarSign, FileText, AlertTriangle, ClipboardCheck, Settings,
  RotateCcw, Clock, BarChart2, MonitorSmartphone, Truck, History
} from 'lucide-react';

export default function Sidebar({ user }) {
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState(0);

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

  const allLinks = [
    { href: '/dashboard', label: 'لوحة القيادة', icon: LayoutDashboard, roles: ['admin', 'accountant', 'rep'] },
    { href: '/pos', label: 'الكاشير (POS)', icon: MonitorSmartphone, roles: ['admin', 'rep'] },
    { href: '/pending', label: 'بانتظار الترحيل', icon: Clock, roles: ['admin'], badge: pendingCount },
    { href: '/customers', label: 'العملاء', icon: Users, roles: ['admin', 'accountant', 'rep'] },
    { href: '/debts', label: 'ديون العملاء', icon: FileText, roles: ['admin', 'accountant', 'rep'] },
    { href: '/customers-statement', label: 'كشف حساب عملاء', icon: FileText, roles: ['admin', 'accountant', 'rep'] },
    { href: '/pos-invoices', label: 'فواتير الكاشير', icon: ShoppingCart, roles: ['admin', 'accountant', 'rep'] },
    { href: '/suppliers', label: 'الموردين', icon: Users, roles: ['admin', 'accountant'] },
    { href: '/purchases', label: 'المشتريات', icon: Package, roles: ['admin', 'accountant'] },
    { href: '/inventory', label: 'المخزون', icon: Package, roles: ['admin', 'accountant', 'rep'] },
    { href: '/returns', label: 'المرتجعات', icon: RotateCcw, roles: ['admin', 'accountant'] },
    { href: '/collections', label: 'التحصيلات', icon: DollarSign, roles: ['admin', 'accountant', 'rep'] },
    { href: '/expenses', label: 'المصروفات', icon: DollarSign, roles: ['admin', 'accountant'] },
    { href: '/damaged', label: 'المواد التالفة', icon: AlertTriangle, roles: ['admin', 'accountant'] },
    { href: '/stocktake', label: 'جرد المخزون', icon: ClipboardCheck, roles: ['admin', 'accountant'] },
    { icon: BarChart2, label: 'التقارير', href: '/reports', roles: ['admin', 'accountant'] },
    { icon: History, label: 'سجل التدقيق', href: '/audit-logs', roles: ['admin'] },
    { icon: Users, label: 'المستخدمين', href: '/users', roles: ['admin'] },
    { icon: Settings, label: 'الإعدادات', href: '/settings', roles: ['admin'] },
  ];

  const links = allLinks.filter((link) => !user?.role || link.roles.includes(user.role));

  return (
    <aside className="w-[260px] bg-white h-screen border-l border-gray-100 flex flex-col shadow-[2px_0_20px_rgba(0,0,0,0.03)] shrink-0 z-20 sticky top-0">
      <div className="p-6 pb-2">
        <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ERP<span className="text-blue-600">System</span></h1>
      </div>
      <div className="px-6 py-4 text-[10px] font-bold text-gray-400 tracking-wider">القائمة الرئيسية</div>
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-white shadow-[0_8px_30px_rgb(0,0,0,0.08)] text-blue-600 font-bold border border-gray-100 translate-x-1'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon size={20} className={isActive ? 'text-blue-600' : 'text-gray-400'} strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[13px]">{link.label}</span>
                {link.badge > 0 && (
                  <span className="min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold">
                    {link.badge}
                  </span>
                )}
              </div>
              <svg className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-300'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
