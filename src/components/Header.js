'use client';
import { Menu, User } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Header() {
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setDateStr(new Date().toLocaleString('en-GB', { 
        day: '2-digit', month: 'short', year: 'numeric', 
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-[76px] flex items-center justify-between px-8 bg-[#f8f9fd] sticky top-0 z-10 w-full">
      <button className="p-2.5 bg-white rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2.5 px-5 py-2 bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-600 rounded-full border border-emerald-100 shadow-sm text-sm font-semibold tracking-wide">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
        {dateStr || 'Loading...'}
      </div>

      <div className="flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.02)] border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
        <div className="flex flex-col text-right">
          <span className="text-sm font-bold text-gray-800">Admin</span>
        </div>
        <div className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-600">
          <User size={18} />
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </header>
  );
}
