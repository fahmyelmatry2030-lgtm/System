'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AppShell from './AppShell';

export default function AuthGuard({ children, allowedRoles = ['admin', 'accountant', 'rep'] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const load = () => {
      // Check if user is logged in
      const storedUser = localStorage.getItem('erp_user');

      if (!storedUser) {
        if (pathname !== '/') {
          router.push('/');
        } else {
          setAuthorized(true); // Allow access to login page if not logged in
        }
        return;
      }

      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);

        // If user is logged in and on login page, redirect to dashboard
        if (pathname === '/') {
          router.push('/dashboard');
          return;
        }

        // Check role permissions
        if (allowedRoles.includes(parsedUser.role)) {
          setAuthorized(true);
        } else {
          // Redirect to a default authorized page or show unauthorized message
          router.push('/dashboard'); 
        }
      } catch (e) {
        localStorage.removeItem('erp_user');
        router.push('/');
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, router, JSON.stringify(allowedRoles)]);

  if (!authorized) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
    );
  }

  // If on login page, don't show layout/sidebar
  if (pathname === '/') {
    return <>{children}</>;
  }

  return (
    <AppShell user={user}>
      {children}
    </AppShell>
  );
}
