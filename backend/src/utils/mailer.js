// Placeholder until the notifications module (Ahmed) adds a real email provider.
// Messages are logged in development and kept in memory under test.
export const testOutbox = [];

export async function sendMail({ to, subject, text }) {
  if (process.env.NODE_ENV === 'test') {
    testOutbox.push({ to, subject, text });
    return;
  }
  console.log(`[mail] To: ${to}\n[mail] Subject: ${subject}\n${text}\n`);
}
