// app/lib/i18n.ts

export type Lang = 'en' | 'pl';

export interface Translations {
  signOut: string;
  today: string;
  forecast: string;
  forecastMode: string;
  projectedBalance: string;
  balanceThisMonth: string;
  balance: string;
  projected: string;
  thinBarNote: string;
  verified: string;
  planned: string;
  recurring: string;
  asPlanned: string;
  verify: string;
  keepPlanned: string;
  plannedAmount: string;
  actualAmount: string;
  add: string;
  plan: string;
  total: string;
  actual: string;
  cancel: string;
  saveChanges: string;
  addEntry: string;
  addAsPlanned: string;
  editEntry: string;
  description: string;
  descriptionPlaceholder: string;
  amount: string;
  date: string;
  plannedEntry: string;
  plannedEntrySub: string;
  recurringEntry: string;
  recurringEntrySub: string;
  required: string;
  invalidAmount: string;
  income: string;
  expenses: string;
  savings: string;
  noEntriesYet: (cat: string) => string;
  planExpected: (cat: string) => string;
  addCategoryEntry: (label: string) => string;
  editCategoryEntry: (label: string) => string;
  constantBannerTitle: string;
  constantBannerBody: string;
  verifyEntry: string;
  saving: string;
  startBalance: string;
  startBalanceSub: string;
  setStartBalance: string;
  fromSavings: string;
  fromSavingsSub: string;
  savingsBalance: string;
  prevMonthSavings: string;
  syncRecurring: string;
  syncRecurringDone: (n: number) => string;
  subCategory: string;
  subCategoryPlaceholder: string;
  general: string;
  renameGroup: string;
  deleteGroup: string;
  confirmDeleteGroup: (name: string, count: number) => string;
  rename: string;
  delete: string;
  continueWithGoogle: string;
  signingIn: string;
  tagline: string;
  driveDisclaimer: string;
  months: string[];
}

export const translations: Record<Lang, Translations> = {
  en: {
    signOut: 'Sign out',
    today: 'Today',
    forecast: 'Forecast',
    forecastMode: 'Forecast mode',
    projectedBalance: 'Projected balance',
    balanceThisMonth: 'Balance this month',
    balance: 'Balance',
    projected: 'projected',
    thinBarNote: 'Thin bar = verified so far',
    verified: 'verified',
    planned: 'planned',
    recurring: 'recurring',
    asPlanned: 'as planned',
    verify: 'Verify',
    keepPlanned: 'Keep planned',
    plannedAmount: 'Planned amount',
    actualAmount: 'Actual amount ($)',
    add: 'Add',
    plan: 'Plan',
    total: 'Total',
    actual: 'actual',
    cancel: 'Cancel',
    saveChanges: 'Save changes',
    addEntry: 'Add entry',
    addAsPlanned: 'Add as planned',
    editEntry: 'Edit entry',
    description: 'Description',
    descriptionPlaceholder: 'e.g. Monthly Salary',
    amount: 'Amount ($)',
    date: 'Date',
    plannedEntry: 'Planned entry',
    plannedEntrySub: 'Expected amount — verify when it happens',
    recurringEntry: 'Recurring entry',
    recurringEntrySub: 'Automatically carry over to next month',
    required: 'Required',
    invalidAmount: 'Enter a valid amount',
    income: 'Income',
    expenses: 'Expenses',
    savings: 'Savings',
    noEntriesYet: (cat) => `No ${cat} entries yet`,
    planExpected: (cat) => `Plan expected ${cat}`,
    addCategoryEntry: (label) => `Add ${label} entry`,
    editCategoryEntry: (label) => `Edit ${label} entry`,
    constantBannerTitle: 'Pre-populated from last month',
    constantBannerBody: 'Recurring entries were carried over. You can remove or toggle them off.',
    verifyEntry: 'Verify entry',
    saving: 'Saving…',
    startBalance: 'Start balance',
    startBalanceSub: 'Opening balance for this month',
    setStartBalance: 'Set start balance',
    fromSavings: 'From savings',
    fromSavingsSub: 'This transaction draws from the savings pool',
    savingsBalance: 'Savings balance',
    prevMonthSavings: 'prev. month',
    syncRecurring: 'Re-apply recurring',
    syncRecurringDone: (n) => n > 0 ? `${n} recurring entr${n === 1 ? 'y' : 'ies'} added` : 'All recurring entries already present',
    subCategory: 'Sub-category',
    subCategoryPlaceholder: 'e.g. Subscriptions',
    general: 'General',
    renameGroup: 'Rename group',
    deleteGroup: 'Delete group',
    confirmDeleteGroup: (name, count) => `Delete "${name}" and its ${count} entr${count === 1 ? 'y' : 'ies'}?`,
    rename: 'Rename',
    delete: 'Delete',
    continueWithGoogle: 'Continue with Google',
    signingIn: 'Signing in\u2026',
    tagline: 'Your finances, stored\nonly on your Google Drive.',
    driveDisclaimer: 'budgetMe only accesses files it creates in\nyour Google Drive. Nothing else.',
    months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  },
  pl: {
    signOut: 'Wyloguj',
    today: 'Dzisiaj',
    forecast: 'Prognoza',
    forecastMode: 'Tryb prognozy',
    projectedBalance: 'Przewidywane saldo',
    balanceThisMonth: 'Saldo w tym miesiącu',
    balance: 'Saldo',
    projected: 'prognozowane',
    thinBarNote: 'Cienki pasek = zweryfikowane',
    verified: 'zweryfikowane',
    planned: 'planowane',
    recurring: 'cykliczny',
    asPlanned: 'zgodnie z planem',
    verify: 'Zweryfikuj',
    keepPlanned: 'Zachowaj planowany',
    plannedAmount: 'Kwota planowana',
    actualAmount: 'Kwota rzeczywista (zł)',
    add: 'Dodaj',
    plan: 'Planuj',
    total: 'Łącznie',
    actual: 'rzeczywiste',
    cancel: 'Anuluj',
    saveChanges: 'Zapisz zmiany',
    addEntry: 'Dodaj wpis',
    addAsPlanned: 'Dodaj jako planowany',
    editEntry: 'Edytuj wpis',
    description: 'Opis',
    descriptionPlaceholder: 'np. Miesięczna pensja',
    amount: 'Kwota (zł)',
    date: 'Data',
    plannedEntry: 'Wpis planowany',
    plannedEntrySub: 'Oczekiwana kwota — zweryfikuj gdy nastąpi',
    recurringEntry: 'Wpis cykliczny',
    recurringEntrySub: 'Automatycznie przenoś do następnego miesiąca',
    required: 'Wymagane',
    invalidAmount: 'Wprowadź prawidłową kwotę',
    income: 'Przychody',
    expenses: 'Wydatki',
    savings: 'Oszczędności',
    noEntriesYet: (cat) => `Brak wpisów: ${cat}`,
    planExpected: (cat) => `Zaplanuj oczekiwane: ${cat}`,
    addCategoryEntry: (label) => `Dodaj wpis: ${label}`,
    editCategoryEntry: (label) => `Edytuj wpis: ${label}`,
    constantBannerTitle: 'Uzupełniono z poprzedniego miesiąca',
    constantBannerBody: 'Wpisy cykliczne zostały przeniesione. Możesz je usunąć lub wyłączyć.',
    verifyEntry: 'Weryfikuj wpis',
    saving: 'Zapisywanie…',
    startBalance: 'Saldo początkowe',
    startBalanceSub: 'Saldo na początku miesiąca',
    setStartBalance: 'Ustaw saldo początkowe',
    fromSavings: 'Z oszczędności',
    fromSavingsSub: 'Ta transakcja pochodzi z puli oszczędności',
    savingsBalance: 'Saldo oszczędności',
    prevMonthSavings: 'poprz. miesiąc',
    syncRecurring: 'Ponów cykliczne',
    syncRecurringDone: (n) => n > 0 ? `Dodano ${n} ${n === 1 ? 'wpis cykliczny' : 'wpisy cykliczne'}` : 'Wszystkie wpisy cykliczne już istnieją',
    subCategory: 'Podkategoria',
    subCategoryPlaceholder: 'np. Subskrypcje',
    general: 'Ogólne',
    renameGroup: 'Zmień nazwę grupy',
    deleteGroup: 'Usuń grupę',
    confirmDeleteGroup: (name, count) => `Usunąć "${name}" i ${count} ${count === 1 ? 'wpis' : 'wpisy'}?`,
    rename: 'Zmień nazwę',
    delete: 'Usuń',
    continueWithGoogle: 'Kontynuuj przez Google',
    signingIn: 'Logowanie\u2026',
    tagline: 'Twoje finanse, przechowywane\nwyłącznie na Twoim Dysku Google.',
    driveDisclaimer: 'budgetMe uzyskuje dostęp tylko do plików,\nktóre sam tworzy na Twoim Dysku Google. Nic więcej.',
    months: ['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
  },
};

const numberFormats: Record<Lang, Intl.NumberFormat> = {
  en: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
  pl: new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 2 }),
};

export function fmt(n: number, lang: Lang): string {
  return numberFormats[lang].format(n);
}

export function fmtShort(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (lang === 'pl') {
    return abs >= 1000
      ? sign + (abs / 1000).toFixed(1).replace('.', ',') + ' tys. zł'
      : sign + Math.round(abs).toString() + ' zł';
  }
  return abs >= 1000
    ? sign + '$' + (abs / 1000).toFixed(1) + 'k'
    : sign + '$' + Math.round(abs).toString();
}
