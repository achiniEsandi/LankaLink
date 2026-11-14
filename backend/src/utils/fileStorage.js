import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

// Private storage outside anything served over HTTP
export const uploadRoot = () => path.resolve(process.env.UPLOAD_DIR || 'uploads');

const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

export const ALLOWED_MIME_TYPES = Object.keys(EXTENSIONS);

// Identify the file from its first bytes instead of trusting the browser's type or the file name
export function detectMimeType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

function resolveInside(folder, storedName) {
  const root = uploadRoot();
  const full = path.resolve(root, folder, storedName);
  if (!full.startsWith(root + path.sep)) throw new Error('Invalid file path');
  return full;
}

export async function saveFile(folder, buffer, mimeType) {
  const storedName = `${crypto.randomUUID()}${EXTENSIONS[mimeType]}`;
  const full = resolveInside(folder, storedName);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, buffer, { flag: 'wx' });
  return storedName;
}

export function filePath(folder, storedName) {
  return resolveInside(folder, storedName);
}

export async function deleteFile(folder, storedName) {
  try {
    await fs.unlink(resolveInside(folder, storedName));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}
