import { google } from 'googleapis';
import { parseCSV, serializeCSV } from './csv';
import type { Entry, Category } from './types';

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
  const q = parentId
    ? `name='${name}' and mimeType='application/vnd.google-apps.folder' and '${parentId}' in parents and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and 'root' in parents and trashed=false`;

  const res = await drive.files.list({ q, fields: 'files(id)', spaces: 'drive' });
  if (res.data.files?.length) return res.data.files[0].id!;

  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
  });
  return created.data.id!;
}

async function ensureFolderPath(drive: ReturnType<typeof google.drive>, year: string, month: string) {
  const rootId = await findOrCreateFolder(drive, 'budgetMe');
  const yearId = await findOrCreateFolder(drive, year, rootId);
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

export async function initMonth(
  accessToken: string,
  year: string,
  month: string
): Promise<boolean> {
  const drive = driveClient(accessToken);
  const monthFolderId = await ensureFolderPath(drive, year, month);
  const categories: Category[] = ['income', 'expenses', 'savings'];

  const needsInit = await Promise.all(
    categories.map((cat) => findFile(drive, `${cat}.csv`, monthFolderId))
  );

  if (needsInit.every((id) => id !== null)) return false; // all files exist

  const { year: py, month: pm } = prevYearMonth(year, month);
  const isPlan = false; // server doesn't know if future; caller decides

  for (let i = 0; i < categories.length; i++) {
    if (needsInit[i] !== null) continue; // file already exists
    const cat = categories[i];

    const prevFolderId = await ensureFolderPath(drive, py, pm);
    const prevFileId = await findFile(drive, `${cat}.csv`, prevFolderId);
    let seedEntries: Entry[] = [];
    if (prevFileId) {
      const prevEntries = await readCSVFile(drive, prevFileId);
      const firstDate = firstOfMonth(year, month);
      seedEntries = prevEntries
        .filter((e) => e.constant)
        .map((e) => ({ ...e, date: firstDate, planned: isPlan }));
    }
    await createCSVFile(drive, `${cat}.csv`, monthFolderId, seedEntries);
  }

  return true; // newly initialized
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
