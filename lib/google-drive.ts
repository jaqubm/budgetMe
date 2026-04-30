import { google } from 'googleapis';
import { parseCSV, serializeCSV } from './csv';
import type { Entry, Category } from './types';

// Folder IDs are stable — cache them across warm function instances to skip redundant list calls.
const folderCache = new Map<string, string>();

function driveClient(accessToken: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  return google.drive({ version: 'v3', auth });
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId?: string
): Promise<string> {
  const cacheKey = `${parentId ?? 'root'}/${name}`;
  const cached = folderCache.get(cacheKey);
  if (cached) return cached;

  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

  const res = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
  let id: string;

  if (res.data.files?.length) {
    id = res.data.files[0].id!;
  } else {
    const created = await drive.files.create({
      requestBody: {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: parentId ? [parentId] : undefined,
      },
      fields: 'id',
    });
    id = created.data.id!;
  }

  folderCache.set(cacheKey, id);
  return id;
}

async function ensureFolderPath(drive: ReturnType<typeof google.drive>, year: string, month: string) {
  const rootId  = await findOrCreateFolder(drive, 'budgetMe');
  const yearId  = await findOrCreateFolder(drive, year, rootId);
  const monthId = await findOrCreateFolder(drive, month, yearId);
  return monthId;
}

async function findFile(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string | null> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and trashed=false`,
    fields: 'files(id)',
    spaces: 'drive',
  });
  return res.data.files?.[0]?.id ?? null;
}

async function readCSVFile(drive: ReturnType<typeof google.drive>, fileId: string): Promise<Entry[]> {
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  return parseCSV(res.data as string);
}

async function writeCSVFile(
  drive: ReturnType<typeof google.drive>,
  fileId: string,
  entries: Entry[]
): Promise<void> {
  await drive.files.update({
    fileId,
    media: { mimeType: 'text/csv', body: serializeCSV(entries) },
  });
}

async function createCSVFile(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string,
  entries: Entry[]
): Promise<string> {
  const res = await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media: { mimeType: 'text/csv', body: serializeCSV(entries) },
    fields: 'id',
  });
  return res.data.id!;
}

async function readStartBalance(
  drive: ReturnType<typeof google.drive>,
  monthFolderId: string
): Promise<number> {
  const fileId = await findFile(drive, 'balance.txt', monthFolderId);
  if (!fileId) return 0;
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  const n = parseFloat(res.data as string);
  return isNaN(n) ? 0 : n;
}

async function writeStartBalanceFile(
  drive: ReturnType<typeof google.drive>,
  monthFolderId: string,
  amount: number
): Promise<void> {
  const fileId = await findFile(drive, 'balance.txt', monthFolderId);
  const body   = String(amount);
  if (fileId) {
    await drive.files.update({ fileId, media: { mimeType: 'text/plain', body } });
  } else {
    await drive.files.create({
      requestBody: { name: 'balance.txt', parents: [monthFolderId] },
      media: { mimeType: 'text/plain', body },
      fields: 'id',
    });
  }
}

async function readSavingsClosing(
  drive: ReturnType<typeof google.drive>,
  monthFolderId: string
): Promise<number> {
  const fileId = await findFile(drive, 'savings_closing.txt', monthFolderId);
  if (!fileId) return 0;
  const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
  const n = parseFloat(res.data as string);
  return isNaN(n) ? 0 : n;
}

async function writeSavingsClosing(
  drive: ReturnType<typeof google.drive>,
  monthFolderId: string,
  amount: number
): Promise<void> {
  const fileId = await findFile(drive, 'savings_closing.txt', monthFolderId);
  const body   = String(amount);
  if (fileId) {
    await drive.files.update({ fileId, media: { mimeType: 'text/plain', body } });
  } else {
    await drive.files.create({
      requestBody: { name: 'savings_closing.txt', parents: [monthFolderId] },
      media: { mimeType: 'text/plain', body },
      fields: 'id',
    });
  }
}

export async function setStartBalance(
  accessToken: string,
  year: string,
  month: string,
  amount: number
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  await writeStartBalanceFile(drive, monthFolderId, amount);
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

const CATEGORIES: Category[] = ['income', 'expenses', 'savings'];

// Initializes the month folder + CSV files (seeding constants from prev month),
// then returns all three entry lists in a single pass — avoids re-resolving folder paths.
export async function initAndGetMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<{ wasNew: boolean; income: Entry[]; expenses: Entry[]; savings: Entry[]; startBalance: number }> {
  try {
    return await _initAndGetMonth(accessToken, year, month);
  } catch (err: unknown) {
    // Stale folder cache: a cached folder ID was deleted from Drive externally.
    // Clear cache and retry once so new folders are created cleanly.
    const e = err as { code?: number; message?: string };
    if (e?.code === 404 || e?.message?.includes('File not found')) {
      folderCache.clear();
      return _initAndGetMonth(accessToken, year, month);
    }
    throw err;
  }
}

async function _initAndGetMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<{ wasNew: boolean; income: Entry[]; expenses: Entry[]; savings: Entry[]; startBalance: number }> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);

  // Check existence of all three CSV files in parallel.
  const fileIds: (string | null)[] = await Promise.all(
    CATEGORIES.map(cat => findFile(drive, `${cat}.csv`, monthFolderId))
  );

  const missingIdxs = fileIds.map((id, i) => id === null ? i : -1).filter(i => i !== -1);
  let wasNew = false;

  if (missingIdxs.length > 0) {
    wasNew = true;
    const { year: py, month: pm } = prevYearMonth(year, month);
    const prevFolderId = await ensureFolderPath(drive, py, pm);
    const firstDate = firstOfMonth(year, month);

    // Fetch prev-month file IDs and their contents in parallel.
    const prevFileIds = await Promise.all(
      missingIdxs.map(i => findFile(drive, `${CATEGORIES[i]}.csv`, prevFolderId))
    );
    const prevEntries = await Promise.all(
      prevFileIds.map(id => id ? readCSVFile(drive, id) : Promise.resolve([]))
    );

    // Create all missing files in parallel.
    const newIds = await Promise.all(
      missingIdxs.map((i, j) => {
        const seed = prevEntries[j]
          .filter(e => e.constant)
          .map(e => ({ ...e, date: firstDate }));
        return createCSVFile(drive, `${CATEGORIES[i]}.csv`, monthFolderId, seed);
      })
    );

    missingIdxs.forEach((i, j) => { fileIds[i] = newIds[j]; });
  }

  // Read all three CSV files and start balance in parallel.
  const [allEntries, startBalance] = await Promise.all([
    Promise.all(fileIds.map(id => id ? readCSVFile(drive, id) : Promise.resolve([]))),
    readStartBalance(drive, monthFolderId),
  ]);

  return { wasNew, income: allEntries[0], expenses: allEntries[1], savings: allEntries[2], startBalance };
}

export async function getEntries(
  accessToken: string,
  year: string,
  month: string,
  category: Category
): Promise<Entry[]> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) return [];
  return readCSVFile(drive, fileId);
}

export async function addEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  entry: Entry
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) {
    await createCSVFile(drive, `${category}.csv`, monthFolderId, [entry]);
    return;
  }
  const entries = await readCSVFile(drive, fileId);
  entries.push(entry);
  await writeCSVFile(drive, fileId, entries);
}

export async function updateEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number,
  entry: Entry
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) throw new Error('File not found');
  const entries = await readCSVFile(drive, fileId);
  entries[index] = entry;
  await writeCSVFile(drive, fileId, entries);
}

export async function patchEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number,
  patch: Partial<Entry>
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) throw new Error('File not found');
  const entries = await readCSVFile(drive, fileId);
  entries[index] = { ...entries[index], ...patch };
  await writeCSVFile(drive, fileId, entries);
}

export async function deleteEntry(
  accessToken: string,
  year: string,
  month: string,
  category: Category,
  index: number
): Promise<void> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const fileId = await findFile(drive, `${category}.csv`, monthFolderId);
  if (!fileId) throw new Error('File not found');
  const entries = await readCSVFile(drive, fileId);
  entries.splice(index, 1);
  await writeCSVFile(drive, fileId, entries);
}
