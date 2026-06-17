export function formatDateTime(value?: string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
