// ============================================================
// api/index.ts
// Vercel serverless entry. vercel.json rewrites every /api/* request
// here, and the shared Express app handles routing, validation and
// security headers exactly as it does locally.
// ============================================================

import { app } from '../server.js';

export default app;
