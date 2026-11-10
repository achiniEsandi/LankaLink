import User from '../models/User.js';
import httpError from '../utils/httpError.js';
import { verifyToken } from '../utils/token.js';

export async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) throw httpError(401, 'Not authenticated');

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw httpError(401, 'Invalid or expired token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw httpError(401, 'Account no longer exists');

  req.user = user;
  next();
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) throw httpError(403, 'Not allowed');
    next();
  };
}
