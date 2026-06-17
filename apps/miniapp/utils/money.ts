export function formatMoney(value?: string | number) {
  if (value === undefined || value === null || value === '') {
    return '0.00';
  }

  return Number(value).toFixed(2);
}
