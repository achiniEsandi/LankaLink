import User from '../models/User.js';
import httpError from '../utils/httpError.js';
import { signToken } from '../utils/token.js';

// Shared login for every role
export async function login(req, res) {
  const { email, password } = req.body ?? {};
  if (!email || !password) throw httpError(400, 'Email and password are required');

  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw httpError(401, 'Incorrect email or password');
  }

  res.json({ token: signToken(user), user });
}
