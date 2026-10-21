import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../store/db.js';

const router = Router();

router.post('/register', (req, res) => {
  const { email, password, full_name, phone, role } = req.body || {};
  if (!email || !password || String(password).length < 6) {
    return res.status(400).json({ detail: 'Email and password (min 6) required' });
  }
  if (db.findUserByEmail(email)) {
    return res.status(400).json({ detail: 'Email already registered' });
  }
  const user = db.createUser({
    email,
    hashed_password: bcrypt.hashSync(password, 10),
    full_name,
    phone,
    role,
  });
  res.json(user);
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = db.findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password || '', user.hashed_password)) {
    return res.status(401).json({ detail: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { sub: String(user.id), role: user.role, email: user.email },
    process.env.SECRET_KEY || 'dev-secret',
    { expiresIn: '24h' }
  );
  res.json({ access_token: token, token_type: 'bearer' });
});

export default router;
