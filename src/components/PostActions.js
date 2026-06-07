'use client';

import { getPostStatus } from '@/lib/api-auth';
import { postTransaction, getStoredUser } from '@/lib/api-client';

export default function PostActions({ entity, record, onPosted }) {
  const user = getStoredUser();
  const isAdmin = user?.role === 'admin';
  const isPending = getPostStatus(record) === 'pending';

  if (!isAdmin || !isPending) return null;

  const handlePost = async () => {
    if (!confirm('هل تريد ترحيل هذه العملية؟ بعد الترحيل لن يتمكن المحاسب أو المندوب من تعديلها.')) return;
    try {
      await postTransaction(entity, record.id);
      window.dispatchEvent(new Event('pending-updated'));
      onPosted?.();
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <button type="button" className="btn btn-success" style={{ fontSize: '0.75rem', padding: '4px 12px' }} onClick={handlePost}>
      ترحيل
    </button>
  );
}
