import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth';
import { tripsRouter } from './routes/trips';
import { expensesRouter } from './routes/expenses';
import { settlementsRouter } from './routes/settlements';
import { syncRouter } from './routes/sync';
import { initializeServerSeed } from './seed';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/settlements', settlementsRouter);
app.use('/api/sync', syncRouter);

// Healthcheck
app.get('/api/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Seed data
initializeServerSeed();

app.listen(PORT, () => {
  console.log(`🚀 TravelSplit Backend Server running on http://localhost:${PORT}`);
});
