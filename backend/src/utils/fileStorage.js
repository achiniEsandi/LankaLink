import mongoose from 'mongoose';
import httpError from './httpError.js';

// Files live in MongoDB (GridFS bucket "uploads"), so every machine sharing the
// Atlas database sees the same files. Nothing is written to local disk.
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });

export const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

// Identify the file from its first bytes instead of trusting the browser's type or the file name
export function detectMimeType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buffer.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

const toId = (storedName) => (mongoose.isValidObjectId(storedName) ? new mongoose.Types.ObjectId(storedName) : null);

// Returns the stored file's id, which the owning record keeps as `storedName`
export function saveFile(owner, buffer, mimeType) {
  return new Promise((resolve, reject) => {
    const upload = bucket().openUploadStream(`${owner}`, { metadata: { owner: `${owner}`, mimeType } });
    upload.once('error', reject);
    upload.once('finish', () => resolve(upload.id.toString()));
    upload.end(buffer);
  });
}

export async function deleteFile(owner, storedName) {
  const id = toId(storedName);
  if (!id) return;
  try {
    await bucket().delete(id);
  } catch (err) {
    // Already gone is fine; anything else is a real failure
    if (!/FileNotFound|not found/i.test(err.message)) throw err;
  }
}

// Streams a stored file into the response; headers must already be set
export async function sendFile(res, storedName) {
  const id = toId(storedName);
  const [file] = id ? await bucket().find({ _id: id }).limit(1).toArray() : [];
  if (!file) throw httpError(404, 'File not found');

  res.set('Content-Length', String(file.length));
  await new Promise((resolve, reject) => {
    bucket().openDownloadStream(id).once('error', reject).once('end', resolve).pipe(res);
  });
}
