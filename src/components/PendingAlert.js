'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredUser } from '@/lib/api-client';

export default function PendingAlert() {
  const [count, setCount] = useState(0);
  const user = getStoredUser();

  useEffect(() => {
    if (user?.role !== 'admin') return;

    const load = () => {
      fetch('/api/pending')
        .then((res) => res.json())
        .then((data) => setCount(data.totalCount || 0))
        .catch(() => setCount(0));
    };

    load();
    window.addEventListener('pending-updated', load);
    const interval = setInterval(load, 30000);
    return () => {
      window.removeEventListener('pending-updated', load);
      clearInterval(interval);
    };
  }, [user?.role]);

  if (user?.role !== 'admin' || count === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between animate-slide">
      <div>
        <p className="font-bold text-orange-800">لديك {count} عملية بانتظار الترحيل</p>
        <p className="text-sm text-orange-600 mt-1">راجع العمليات التي أنشأها المحاسب أو المندوب واعتمدها قبل تطبيقها على المخزون والأرصدة</p>
      </div>
      <Link href="/pending" className="btn btn-primary whitespace-nowrap">
        مراجعة العمليات
      </Link>
    </div>
  );
}
