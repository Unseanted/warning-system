import { Router } from 'express';
import { db } from '../store/db.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json(db.listStations());
});

// support both /stations and /stations/ 
router.get('', (_req, res) => res.json(db.listStations()));

router.post('/', (req, res) => {
  const { name, state, latitude, longitude, river_name } = req.body || {};
  if (!name || !state) return res.status(400).json({ detail: 'name and state required' });
  const row = db.createStation({ name, state, latitude, longitude, river_name });
  res.json(row);
});

router.get('/:id', (req, res) => {
  const row = db.getStation(req.params.id);
  if (!row) return res.status(404).json({ detail: 'Station not found' });
  res.json(row);
});

export default router;
