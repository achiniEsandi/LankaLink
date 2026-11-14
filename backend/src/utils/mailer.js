import nodemailer from 'nodemailer';

// Shared email sender. Sends through SMTP when SMTP_HOST is set; otherwise logs the
// message (development) or keeps it in memory (tests). Notifications can reuse this.
export const testOutbox = [];

let transport;

function getTransport() {
  if (!transport) {
    transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      // Port 465 uses TLS from the start; 587 upgrades with STARTTLS
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }
  return transport;
}

export async function sendMail({ to, subject, text }) {
  if (process.env.NODE_ENV === 'test') {
    testOutbox.push({ to, subject, text });
    return;
  }
  if (!process.env.SMTP_HOST) {
    console.log(`[mail] SMTP_HOST not set, so not sending.\n[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`);
    return;
  }
  await getTransport().sendMail({
    from: process.env.MAIL_FROM || 'LankaLink <no-reply@lankalink.lk>',
    to,
    subject,
    text,
  });
}
