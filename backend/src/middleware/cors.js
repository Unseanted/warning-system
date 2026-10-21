import cors from 'cors';

const DEFAULT_ORIGINS = [
  'https://flood-risk-system-ten.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

export function corsMiddleware() {
  const fromEnv = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const allowList = [...new Set([...DEFAULT_ORIGINS, ...fromEnv])];

  return cors({
    origin(origin, cb) {
      // allow non-browser tools (no Origin header)
      if (!origin) return cb(null, true);
      if (allowList.includes('*') || allowList.includes(origin)) {
        return cb(null, true);
      }
      // allow all vercel.app preview deployments of this project
      if (/^https:\/\/flood-risk-system.*\.vercel\.app$/.test(origin)) {
        return cb(null, true);
      }
      console.warn('[CORS] blocked origin:', origin);
      return cb(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
}
