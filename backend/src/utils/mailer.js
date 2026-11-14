// Sends email through Brevo's HTTPS API (no extra package needed).
// Without BREVO_API_KEY the message is printed to the backend console instead,
// so sign-up still works during development. Tests keep messages in memory.
export const sentMail = [];

export async function sendMail({ to, subject, text, html }) {
  if (process.env.NODE_ENV === 'test') {
    sentMail.push({ to, subject, text, html });
    return;
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(`\n[email not sent: BREVO_API_KEY is not set]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return;
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      sender: { email: process.env.EMAIL_FROM, name: process.env.EMAIL_FROM_NAME || 'LankaLink' },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Email provider rejected the message (${res.status}): ${detail.slice(0, 200)}`);
  }
}
