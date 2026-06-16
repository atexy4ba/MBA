import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { globalLimiter } from './middleware/rateLimit';
import { analyticsMiddleware } from './middleware/analytics';
import { errorHandler } from './middleware/errorHandler';
import { publicRoutes } from './routes/v1/public';
import { adminRoutes } from './routes/v1/admin';
import path from 'path';

export const app = express();

app.set('trust proxy', 1);

app.use(compression());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.BASE_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(globalLimiter);
app.use(analyticsMiddleware);

app.use('/api/v1', publicRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Route API introuvable.',
    },
  });
});

app.get('/sitemap.xml', (_req, res) => {
  const baseUrl = process.env.BASE_URL || 'https://madebyalgerians.com';
  const urls = [
    { loc: `${baseUrl}/fr`, priority: '1.0' },
    { loc: `${baseUrl}/fr/categories/hauts-unisexe`, priority: '0.8' },
    { loc: `${baseUrl}/fr/categories/outerwear`, priority: '0.8' },
    { loc: `${baseUrl}/fr/categories/accessoires`, priority: '0.8' },
    { loc: `${baseUrl}/fr/categories/professionnel`, priority: '0.8' },
    { loc: `${baseUrl}/fr/privacy`, priority: '0.3' },
  ];
  res.set('Content-Type', 'application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>`);
});

const distPath = path.resolve('dist');
app.use(express.static(distPath, { maxAge: '7d' }));
app.get('/{*splat}', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3000;
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
