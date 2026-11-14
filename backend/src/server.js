import 'dotenv/config';
import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;
const { MONGO_URI } = process.env;

// No silent fallback to a local database: everyone must point at the shared MongoDB Atlas cluster
for (const name of ['MONGO_URI', 'JWT_SECRET']) {
  if (!process.env[name]) {
    console.error(`${name} is not set. Copy backend/.env.example to backend/.env and fill it in.`);
    process.exit(1);
  }
}

// Anyone who knows the secret can forge a login for any account, so a guessable one is refused
if (process.env.JWT_SECRET === 'change-me' || process.env.JWT_SECRET.length < 32) {
  console.error(
    'JWT_SECRET is too weak. Generate one with:\n' +
      '  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"\n' +
      'and paste it into backend/.env',
  );
  process.exit(1);
}

try {
  await connectDB(MONGO_URI);
  app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
} catch (err) {
  console.error('Failed to start server:', err.message);
  process.exit(1);
}
