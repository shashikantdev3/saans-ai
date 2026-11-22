// ============================================================
// server/middleware.ts
// Security headers, dynamic CORS, rate limiters, and error handlers
// ============================================================

import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import type { Request, Response, NextFunction } from 'express';

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3001',
  'http://localhost:4173',
  'https://saans-ai-kappa.vercel.app',
];

// Production plus this project's own Vercel preview deployments only.
const SAANS_PREVIEW_ORIGIN = /^https:\/\/saans-ai(-[a-z0-9-]+)?\.vercel\.app$/;

export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", 'https://*.googleapis.com', 'http://localhost:*'],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      ALLOWED_ORIGINS.includes(origin) ||
      SAANS_PREVIEW_ORIGIN.test(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:')
    ) {
      return callback(null, true);
    }
    return callback(new Error(`CORS policy violation: ${origin}`), false);
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again in a minute.' },
});

export function safeErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  console.error('[SECURITY AUDIT] Internal Server Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
}
