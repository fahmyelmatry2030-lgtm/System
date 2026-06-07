export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('erp_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function withUser(payload = {}) {
  const user = getStoredUser();
  return { ...payload, _user: user };
}

export async function postTransaction(entity, id) {
  const res = await fetch('/api/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(withUser({ entity, id })),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'فشل الترحيل');
  return data;
}
