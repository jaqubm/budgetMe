export type Category = 'income' | 'expenses' | 'savings';

export interface Entry {
  date: string;         // YYYY-MM-DD
  amount: number;
  description: string;
  constant: boolean;
  planned: boolean;
  plannedAmount?: number; // set after verification
  fromSavings?: boolean;  // draws from the savings pool (income and expenses only)
}

export interface MonthData {
  income: Entry[];
  expenses: Entry[];
  savings: Entry[];
  startBalance: number;
  openingSavings: number; // previous month's closing savings pool balance
}

export const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'income',   label: 'Income'   },
  { key: 'expenses', label: 'Expenses' },
  { key: 'savings',  label: 'Savings'  },
];
