import { sendMail } from './mailer.js';

const escapeHtml = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function verificationLink(token) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/$/, '');
  return `${base}/verify-email?token=${token}`;
}

// Sends the confirmation email; issuing the token is the caller's job (user.issueEmailVerification)
export function sendVerificationEmail(user, token) {
  const link = verificationLink(token);
  const firstName = user.name.split(/\s+/)[0];
  return sendMail({
    to: user.email,
    subject: 'Confirm your email for LankaLink',
    text: `Hi ${firstName},\n\nPlease confirm your email address by opening this link:\n${link}\n\nThe link works for 24 hours. If you did not sign up for LankaLink, you can ignore this email.\n\nLankaLink`,
    html: `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:520px;margin:auto;color:#1f2421">
  <h2 style="color:#1d5c4f">Confirm your email</h2>
  <p>Hi ${escapeHtml(firstName)},</p>
  <p>Please confirm this is your email address so we can review your LankaLink application.</p>
  <p style="margin:28px 0"><a href="${link}" style="background:#1d5c4f;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Confirm my email</a></p>
  <p style="color:#5f655f;font-size:14px">The link works for 24 hours. If you did not sign up for LankaLink, you can ignore this email.</p>
</div>`,
  });
}
