import jwt from 'jsonwebtoken';

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.SECRET_KEY || 'dev-secret');
    } catch {
      req.user = null;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ detail: 'Unauthorized' });
  try {
    req.user = jwt.verify(token, process.env.SECRET_KEY || 'dev-secret');
    next();
  } catch {
    return res.status(401).json({ detail: 'Invalid token' });
  }
}
