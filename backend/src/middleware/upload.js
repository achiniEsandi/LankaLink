import multer from 'multer';
import { DOCUMENT_MAX_BYTES } from '../constants/index.js';

// Kept in memory so the file can be checked before anything touches the disk
export const documentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: DOCUMENT_MAX_BYTES, files: 1, fields: 5 },
}).single('file');

export function uploadErrorMessage(err) {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return { status: 413, message: `File is larger than ${DOCUMENT_MAX_BYTES / (1024 * 1024)} MB` };
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE' || err.code === 'LIMIT_FILE_COUNT') {
    return { status: 400, message: 'Upload one file at a time' };
  }
  return { status: 400, message: 'The upload could not be read' };
}
