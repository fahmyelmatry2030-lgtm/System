'use client';

import { useEffect, useState } from 'react';

export default function RoleGuard({ allowedRoles, children, fallback = null }) {
  const [role, setRole] = useState(null);
  
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('erp_user') || '{}');
      setRole(user.role);
    } catch (e) {
      setRole('guest');
    }
  }, []);

  if (!role) return null; // Loading state

  if (allowedRoles.includes(role)) {
    return <>{children}</>;
  }
  
  return fallback ? <>{fallback}</> : null;
}
