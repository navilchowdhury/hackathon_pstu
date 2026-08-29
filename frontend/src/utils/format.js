export function formatBDT(value) {
  const amount = Number(value) || 0;
  return `${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} BDT`;
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function monthLabel(year, month) {
  return new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'short' });
}

export function statusTone(status) {
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'REVERSED':
      return 'neutral';
    default:
      return 'warning';
  }
}

export function riskTone(level) {
  if (level === 'HIGH') return 'danger';
  if (level === 'MEDIUM') return 'warning';
  return 'success';
}
