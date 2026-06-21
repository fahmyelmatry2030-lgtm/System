// توقيت العراق (UTC+3)
const IRAQ_TIMEZONE = 'Asia/Baghdad';

export function getIraqDateTime() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: IRAQ_TIMEZONE }));
}

export function formatIraqDate(date = null) {
  const d = date ? new Date(date) : getIraqDateTime();
  return d.toLocaleDateString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: IRAQ_TIMEZONE
  });
}

export function formatIraqDateTime(date = null) {
  const d = date ? new Date(date) : getIraqDateTime();
  return d.toLocaleString('ar-IQ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: IRAQ_TIMEZONE,
    hour12: false
  });
}

export function getIraqDateISO(date = null) {
  const d = date ? new Date(date) : getIraqDateTime();
  const offset = 3 * 60 * 60 * 1000; // UTC+3
  const localDate = new Date(d.getTime() + offset);
  return localDate.toISOString().split('T')[0];
}

export function getDayName(date = null) {
  const d = date ? new Date(date) : getIraqDateTime();
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  return days[d.getDay()];
}

export function getMonthName(monthIndex) {
  const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  return months[monthIndex];
}
