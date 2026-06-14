import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { analyticsEvents } from '../db/schema';

export function analyticsMiddleware(req: Request, res: Response, next: NextFunction) {
  if (process.env.ANALYTICS_ENABLED !== 'true') {
    next();
    return;
  }

  const startTime = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - startTime;

    db.insert(analyticsEvents)
      .values({
        eventType: 'page_view',
        productId: null,
        userId: req.user?.userId ?? null,
        sessionId: req.cookies?.sessionId ?? null,
        pageUrl: req.originalUrl,
        referrer: req.get('referer') ?? null,
        ip: req.ip ?? null,
        userAgent: req.get('user-agent') ?? null,
        metadata: JSON.stringify({
          method: req.method,
          statusCode: res.statusCode,
          responseTime,
        }),
      })
      .execute()
      .catch((err) => console.error('Analytics error:', err));
  });

  next();
}
