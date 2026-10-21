import { Router } from 'express';
import { db } from '../store/db.js';
import { sendSms, buildAlertMessage } from '../services/twilioService.js';

const router = Router();

router.get('/', (req, res) => {
  const limit = Number(req.query.limit) || 50;
  res.json(db.listAlerts(limit));
});

router.post('/send', async (req, res, next) => {
  try {
    const { station_id, recipient_phone, message, risk_level } = req.body || {};
    const station = db.getStation(station_id);
    if (!station) return res.status(404).json({ detail: 'Station not found' });
    if (!recipient_phone) return res.status(400).json({ detail: 'recipient_phone required' });

    const labels = { 0: 'Low', 1: 'Moderate', 2: 'High', 3: 'Extreme' };
    const msg = message || buildAlertMessage(station.name, labels[risk_level ?? 2] || 'High');
    const tw = await sendSms(recipient_phone, msg);
    const alert = db.createAlert({
      station_id: Number(station_id),
      recipient_phone,
      message: msg,
      status: tw.status || 'failed',
      sent_at: ['sent', 'demo_sent'].includes(tw.status) ? new Date().toISOString() : null,
    });
    res.json(alert);
  } catch (e) {
    next(e);
  }
});

router.post('/subscribe', (req, res) => {
  const { station_id, phone, min_risk_level } = req.body || {};
  if (!station_id || !phone) return res.status(400).json({ detail: 'station_id and phone required' });
  const sub = db.createSubscription({
    station_id: Number(station_id),
    phone,
    min_risk_level: min_risk_level ?? 2,
  });
  res.json(sub);
});

router.get('/subscriptions', (_req, res) => {
  res.json(db.listSubscriptions());
});

export default router;
