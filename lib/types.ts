export type Category = 'income' | 'expenses' | 'savings';

export interface Entry {
  date: string;         // YYYY-MM-DD
  amount: number;
  description: string;
  constant: boolean;
  planned: boolean;
  plannedAmount?: number; // set after verification
}

export interface MonthData {
  income: Entry[];
  expenses: Entry[];
  savings: Entry[];
}

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'income',   label: 'Income'   },
  { key: 'expenses', label: 'Expenses' },
  { key: 'savings',  label: 'Savings'  },
];
