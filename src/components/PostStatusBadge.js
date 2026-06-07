import { getPostStatus } from '@/lib/api-auth';

export default function PostStatusBadge({ record }) {
  const status = getPostStatus(record);
  const isPosted = status === 'posted';

  return (
    <span className={`badge ${isPosted ? 'badge-success' : 'badge-warning'}`}>
      {isPosted ? 'مرحّل' : 'بانتظار الترحيل'}
    </span>
  );
}
