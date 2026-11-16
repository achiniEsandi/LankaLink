import { sendMail } from './mailer.js';

export function verificationLink(token) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/verify-email?token=${token}`;
}

// Sends the confirmation email through the shared mailer (plain text);
// issuing the token is the caller's job (user.issueEmailVerification)
export function sendVerificationEmail(user, token) {
  const firstName = user.name.split(/\s+/)[0];
  const reason =
    user.role === 'provider' ? 'so we can review your LankaLink application' : 'so we can send you booking updates and visit reports';
  return sendMail({
    to: user.email,
    subject: 'Confirm your email for LankaLink',
    text: `Hi ${firstName},\n\nPlease confirm your email address ${reason}:\n${verificationLink(token)}\n\nThe link works for 24 hours. If you did not sign up for LankaLink, you can ignore this email.\n\nLankaLink`,
  });
}
