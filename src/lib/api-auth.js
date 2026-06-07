export function getUserFromRequest(data) {
  return data?._user || null;
}

export function isAdmin(user) {
  return user?.role === 'admin';
}

export function getPostStatus(record) {
  return record?.postStatus || record?.poststatus || 'pending';
}

export function isPosted(record) {
  return getPostStatus(record) === 'posted';
}

export function canModifyRecord(record, user) {
  if (!user) return false;
  if (isAdmin(user)) return true;
  return !isPosted(record);
}

export function requireAdmin(user) {
  if (!isAdmin(user)) {
    throw new Error('هذه العملية متاحة للمدير فقط');
  }
}
