import { describe, it, expect } from 'vitest';
import { parseCSV, serializeCSV } from './csv';

describe('parseCSV', () => {
  it('parses header-only CSV to empty array', () => {
    const csv = 'date,amount,description,constant,planned,plannedAmount\n';
    expect(parseCSV(csv)).toEqual([]);
  });

  it('parses a basic entry', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount',
      '2026-04-01,5000.00,Salary,true,false,',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-04-01',
      amount: 5000,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: undefined,
    }]);
  });

  it('parses a verified planned entry', () => {
    const csv = [
      'date,amount,description,constant,planned,plannedAmount',
      '2026-05-01,5100.00,Salary,true,false,5000.00',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-05-01',
      amount: 5100,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: 5000,
    }]);
  });

  it('handles legacy CSV without planned columns', () => {
    const csv = [
      'date,amount,description,constant',
      '2026-04-01,100.00,Test,false',
    ].join('\n');
    expect(parseCSV(csv)).toEqual([{
      date: '2026-04-01',
      amount: 100,
      description: 'Test',
      constant: false,
      planned: false,
      plannedAmount: undefined,
    }]);
  });
});

describe('serializeCSV', () => {
  it('round-trips entries', () => {
    const entries = [{
      date: '2026-04-01',
      amount: 5000,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: undefined,
    }];
    const csv = serializeCSV(entries);
    expect(parseCSV(csv)).toEqual(entries);
  });

  it('preserves plannedAmount', () => {
    const entries = [{
      date: '2026-05-01',
      amount: 5100,
      description: 'Salary',
      constant: true,
      planned: false,
      plannedAmount: 5000,
    }];
    expect(parseCSV(serializeCSV(entries))).toEqual(entries);
  });

  it('serializes empty array to header only', () => {
    const csv = serializeCSV([]);
    expect(csv).toBe('date,amount,description,constant,planned,plannedAmount\n');
  });
});
