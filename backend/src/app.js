import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import authRoutes from './routes/auth.js';
import customerRoutes from './routes/customers.js';
import healthRoutes from './routes/health.js';
import providerRoutes from './routes/providers.js';
import serviceRoutes from './routes/services.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/services', serviceRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.fromEntries(Object.entries(err.errors).map(([field, e]) => [field, e.message]));
    return res.status(400).json({ message: 'Validation failed', details });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: `${Object.keys(err.keyValue ?? {}).join(', ') || 'Value'} already exists` });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : err.message,
    ...(err.details && { details: err.details }),
  });
});

export default app;
