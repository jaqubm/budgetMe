import type { Entry } from './types';

const HEADER = 'date,amount,description,constant,planned,plannedAmount';

export function parseCSV(text: string): Entry[] {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length <= 1) return [];
  const header = lines[0].split(',');
  const hasPlanned = header.includes('planned');

  return lines.slice(1).map((line) => {
    const cols = line.split(',');
    const get = (col: string, fallback = '') =>
      header.includes(col) ? (cols[header.indexOf(col)] ?? fallback) : fallback;

    const plannedAmountRaw = get('plannedAmount');
    return {
      date:          get('date'),
      amount:        parseFloat(get('amount', '0')),
      description:   get('description'),
      constant:      get('constant') === 'true',
      planned:       hasPlanned ? get('planned') === 'true' : false,
      plannedAmount: plannedAmountRaw ? parseFloat(plannedAmountRaw) : undefined,
    };
  });
}

export function serializeCSV(entries: Entry[]): string {
  const rows = entries.map((e) =>
    [
      e.date,
      e.amount.toFixed(2),
      e.description.replace(/,/g, ';'),
      e.constant,
      e.planned,
      e.plannedAmount != null ? e.plannedAmount.toFixed(2) : '',
    ].join(',')
  );
  return [HEADER, ...rows].join('\n') + '\n';
}
