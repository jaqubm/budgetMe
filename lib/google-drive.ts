import { google } from 'googleapis';
import type { Entry, Category } from './types';

// Root "budgetMe" folder ID is stable — cache across warm function instances.
const folderCache = new Map<string, string>();
// Month file IDs are stable — cache to skip redundant list calls.
const fileIdCache = new Map<string, string>();

interface MonthFile {
  income: Entry[];
  expenses: Entry[];
  savings: Entry[];
  startBalance: number;
  openingSavings: number;  // prev month's savingsClosing, set once at month init
  savingsClosing: number;  // recomputed on every write
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 500): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
    }
  }
  throw lastErr;
}

function driveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

async function getRootFolderId(drive: ReturnType<typeof google.drive>): Promise<string> {
  const cached = folderCache.get('budgetMe');
  if (cached) return cached;

  const res = await drive.files.list({
    q: `name='budgetMe' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  let id: string;
  if (res.data.files?.length) {
    id = res.data.files[0].id!;
  } else {
    const created = await withRetry(() => drive.files.create({
      requestBody: { name: 'budgetMe', mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    }));
    id = created.data.id!;
  }

  folderCache.set('budgetMe', id);
  return id;
}

function monthFileName(year: string, month: string): string {
  return `${year}-${month}.json`;
}

async function findFileId(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string | null> {
  const cacheKey = `${parentId}/${name}`;
  const cached = fileIdCache.get(cacheKey);
  if (cached) return cached;

  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });

  const id = res.data.files?.[0]?.id ?? null;
  if (id) fileIdCache.set(cacheKey, id);
  return id;
}

async function readMonthFile(
  drive: ReturnType<typeof google.drive>,
  fileId: string
): Promise<MonthFile> {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return JSON.parse(res.data as string) as MonthFile;
}

async function writeMonthFile(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
  data: MonthFile
): Promise<void> {
  await withRetry(() => drive.files.update({
    fileId,
    media: { mimeType: 'application/json', body: JSON.stringify(data) },
  }));
}

async function createMonthFile(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string,
  data: MonthFile
): Promise<string> {
  const res = await withRetry(() => drive.files.create({
    requestBody: { name, parents: [parentId] },
    media: { mimeType: 'application/json', body: JSON.stringify(data) },
    fields: 'id',
  }));
  const id = res.data.id!;
  fileIdCache.set(`${parentId}/${name}`, id);
  return id;
}

function computeSavingsClosing(file: MonthFile): number {
  const savingsSum = file.savings.reduce((s, e) => s + e.amount, 0);
  const fromSavingsDeductions = [...file.income, ...file.expenses]
    .filter(e => e.fromSavings)
    .reduce((s, e) => s + e.amount, 0);
  return file.openingSavings + savingsSum - fromSavingsDeductions;
}

function prevYearMonth(year: string, month: string): { year: string; month: string } {
  let y = parseInt(year);
  let m = parseInt(month);
  m--;
  if (m < 1) { m = 12; y--; }
  return { year: String(y), month: String(m).padStart(2, '0') };
}

function firstOfMonth(year: string, month: string): string {
  return `${year}-${month}-01`;
}

// Read the month file, apply a mutation, recompute savingsClosing, write back atomically.
async function mutateMonth(
  drive: ReturnType<typeof google.drive>,
  rootId: string,
  year: string,
  month: string,
  mutate: (data: MonthFile) => void
): Promise<void> {
  const name = monthFileName(year, month);
  const fileId = await findFileId(drive, name, rootId);
  if (!fileId) throw new Error(`Month file not found: ${name}`);
  const data = await readMonthFile(drive, fileId);
  mutate(data);
  data.savingsClosing = computeSavingsClosing(data);
  await writeMonthFile(drive, fileId, data);
}

export async function initAndGetMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<{ wasNew: boolean; income: Entry[]; expenses: Entry[]; savings: Entry[]; startBalance: number; openingSavings: number }> {
  try {
    return await _initAndGetMonth(accessToken, year, month);
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e?.code === 404 || e?.message?.includes('File not found')) {
      folderCache.clear();
      fileIdCache.clear();
      return _initAndGetMonth(accessToken, year, month);
    }
    throw err;
  }
}

async function _initAndGetMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<{ wasNew: boolean; income: Entry[]; expenses: Entry[]; savings: Entry[]; startBalance: number; openingSavings: number }> {
  const drive  = driveClient(accessToken);
  const rootId = await getRootFolderId(drive);
  const name   = monthFileName(year, month);

  const fileId = await findFileId(drive, name, rootId);
  if (fileId) {
    const data = await readMonthFile(drive, fileId);
    return {
      wasNew:        false,
      income:        data.income,
      expenses:      data.expenses,
      savings:       data.savings,
      startBalance:  data.startBalance,
      openingSavings: data.openingSavings,
    };
  }

  // New month — read prev month for opening savings and constant-entry seeds.
  const { year: py, month: pm } = prevYearMonth(year, month);
  const prevFileId = await findFileId(drive, monthFileName(py, pm), rootId);

  let openingSavings = 0;
  let income:   Entry[] = [];
  let expenses: Entry[] = [];
  let savings:  Entry[] = [];

  if (prevFileId) {
    const prev   = await readMonthFile(drive, prevFileId);
    openingSavings = prev.savingsClosing;
    const firstDate = firstOfMonth(year, month);
    income   = prev.income.filter(e => e.constant).map(e => ({ ...e, date: firstDate }));
    expenses = prev.expenses.filter(e => e.constant).map(e => ({ ...e, date: firstDate }));
    savings  = prev.savings.filter(e => e.constant).map(e => ({ ...e, date: firstDate }));
  }

  const newFile: MonthFile = { income, expenses, savings, startBalance: 0, openingSavings, savingsClosing: 0 };
  newFile.savingsClosing = computeSavingsClosing(newFile);
  await createMonthFile(drive, name, rootId, newFile);

  return {
    wasNew: true,
    income:        newFile.income,
    expenses:      newFile.expenses,
    savings:       newFile.savings,
    startBalance:  newFile.startBalance,
    openingSavings: newFile.openingSavings,
  };
}

export async function getEntries(
  accessToken: string,
  year: string,
  month: string,
  category: Category
): Promise<Entry[]> {
  const drive  = driveClient(accessToken);
  const rootId = await getRootFolderId(drive);
  const fileId = await findFileId(drive, monthFileName(year, month), rootId);
  if (!fileId) return [];
  const data = await readMonthFile(drive, fileId);
  return data[category];
}

export async function addEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  entry: Entry
): Promise<void> {
  const drive  = driveClient(accessToken);
  const rootId = await getRootFolderId(drive);
  await mutateMonth(drive, rootId, year, month, data => { data[category].push(entry); });
}

export async function updateEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number,
  entry: Entry
): Promise<void> {
  const drive  = driveClient(accessToken);
  const rootId = await getRootFolderId(drive);
  await mutateMonth(drive, rootId, year, month, data => { data[category][index] = entry; });
}

export async function patchEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number,
  patch: Partial<Entry>
): Promise<void> {
  const drive  = driveClient(accessToken);
  const rootId = await getRootFolderId(drive);
  await mutateMonth(drive, rootId, year, month, data => {
    data[category][index] = { ...data[category][index], ...patch };
  });
}

export async function deleteEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number
): Promise<void> {
  const drive  = driveClient(accessToken);
  const rootId = await getRootFolderId(drive);
  await mutateMonth(drive, rootId, year, month, data => { data[category].splice(index, 1); });
}

export async function setStartBalance(
  accessToken: string,
  year: string,
  month: string,
  amount: number
): Promise<void> {
  const drive  = driveClient(accessToken);
  const rootId = await getRootFolderId(drive);
  await mutateMonth(drive, rootId, year, month, data => { data.startBalance = amount; });
}
