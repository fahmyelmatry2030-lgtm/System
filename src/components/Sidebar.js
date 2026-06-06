'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, ArrowDownLeft, DollarSign, FileText, AlertTriangle, ClipboardCheck, Settings, RotateCcw } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'لوحة القيادة', icon: LayoutDashboard },
    { href: '/customers', label: 'العملاء', icon: Users },
    { href: '/suppliers', label: 'الموردين', icon: Users },
    { href: '/inventory', label: 'المخزون', icon: Package },
    { href: '/sales', label: 'المبيعات', icon: ShoppingCart },
    { href: '/purchases', label: 'المشتريات', icon: ArrowDownLeft },
    { href: '/returns', label: 'المرتجعات', icon: RotateCcw },
    { href: '/collections', label: 'التحصيلات', icon: DollarSign },
    { href: '/expenses', label: 'المصروفات', icon: DollarSign },
    { href: '/damaged', label: 'المواد التالفة', icon: AlertTriangle },
    { href: '/stocktake', label: 'جرد المخزون', icon: ClipboardCheck },
    { href: '/reports', label: 'التقارير', icon: FileText },
    { href: '/users', label: 'المستخدمين', icon: Settings },
  ];

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
