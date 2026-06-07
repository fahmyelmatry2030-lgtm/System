export function formatCurrency(num) {
  const value = Number(num) || 0;
  return new Intl.NumberFormat('ar-IQ', { maximumFractionDigits: 0 }).format(value) + ' د.ع';
}

export const CURRENCY_LABEL = 'د.ع';
