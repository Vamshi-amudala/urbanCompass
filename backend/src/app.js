import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { connectDatabase } from './config/db.js';
import routeRoutes from './routes/routeRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import segmentRoutes from './routes/segmentRoutes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use('/routes', routeRoutes);
app.use('/feedback', feedbackRoutes);
app.use('/segments', segmentRoutes);

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

connectDatabase(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => console.log(`Backend listening on ${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });

export default app;


