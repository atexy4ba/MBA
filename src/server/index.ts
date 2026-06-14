import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middleware/rateLimit';
import { analyticsMiddleware } from './middleware/analytics';
import { errorHandler } from './middleware/errorHandler';
import { publicRoutes } from './routes/v1/public';
import { adminRoutes } from './routes/v1/admin';
import path from 'path';

export const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.BASE_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(globalLimiter);
app.use(analyticsMiddleware);

app.use('/api/v1', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);
