import { Router } from 'express';
import { db } from '../store/db.js';
import { predictRisk, getMetrics } from '../services/mlService.js';
import { sendSms, buildAlertMessage } from '../services/twilioService.js';

const router = Router();

router.post('/predict', async (req, res, next) => {
  try {
    const body = req.body || {};
    const station = db.getStation(body.station_id);
    if (!station) return res.status(404).json({ detail: 'Station not found' });

    const ml = predictRisk({
      daily_rainfall_mm: Number(body.daily_rainfall_mm) || 0,
      river_level_m: Number(body.river_level_m) || 0,
      antecedent_3day_rain_mm: Number(body.antecedent_3day_rain_mm) || 0,
      antecedent_7day_rain_mm: Number(body.antecedent_7day_rain_mm) || 0,
      river_level_change_m: Number(body.river_level_change_m) || 0,
      month: body.month != null ? Number(body.month) : new Date().getMonth() + 1,
    });

    const alertTriggered = ml.predicted_risk_class >= 2;
    const pred = db.createPrediction({
      station_id: Number(body.station_id),
      daily_rainfall_mm: body.daily_rainfall_mm,
      river_level_m: body.river_level_m,
      antecedent_3day_rain_mm: body.antecedent_3day_rain_mm || 0,
      rf_probabilities: JSON.stringify(ml.rf.probabilities),
      ensemble_probabilities: JSON.stringify(ml.probabilities),
      predicted_risk_class: ml.predicted_risk_class,
      risk_label: ml.risk_label,
      alert_triggered: alertTriggered ? 1 : 0,
    });

    if (alertTriggered) {
      const subs = db.activeSubsForStation(body.station_id, ml.predicted_risk_class);
      for (const sub of subs) {
        const msg = buildAlertMessage(station.name, ml.risk_label);
        const tw = await sendSms(sub.phone, msg);
        db.createAlert({
          prediction_id: pred.id,
          station_id: Number(body.station_id),
          recipient_phone: sub.phone,
          message: msg,
          status: tw.status || 'failed',
          sent_at: ['sent', 'demo_sent'].includes(tw.status) ? new Date().toISOString() : null,
        });
      }
    }

    res.json({
      id: pred.id,
      station_id: pred.station_id,
      prediction_timestamp: pred.prediction_timestamp,
      predicted_risk_class: ml.predicted_risk_class,
      risk_label: ml.risk_label,
      probabilities: ml.probabilities,
      alert_triggered: alertTriggered,
      recommended_action: ml.recommended_action,
      rf: ml.rf,
      lstm: ml.lstm,
      ensemble_weights: ml.ensemble_weights,
      model_version: ml.model_version,
    });
  } catch (e) {
    next(e);
  }
});

router.get('/latest', (_req, res) => {
  const rows = db.latestPredictions(20);
  res.json(
    rows.map((p) => ({
      id: p.id,
      station_id: p.station_id,
      prediction_timestamp: p.prediction_timestamp,
      predicted_risk_class: p.predicted_risk_class,
      risk_label: p.risk_label,
      probabilities:
        typeof p.ensemble_probabilities === 'string'
          ? JSON.parse(p.ensemble_probabilities || '{}')
          : p.ensemble_probabilities || {},
      alert_triggered: Boolean(p.alert_triggered),
      recommended_action: '',
    }))
  );
});

router.get('/station/:id', (req, res) => {
  const limit = Number(req.query.limit) || 10;
  const rows = db.stationPredictions(req.params.id, limit);
  res.json(
    rows.map((p) => ({
      id: p.id,
      station_id: p.station_id,
      prediction_timestamp: p.prediction_timestamp,
      predicted_risk_class: p.predicted_risk_class,
      risk_label: p.risk_label,
      probabilities:
        typeof p.ensemble_probabilities === 'string'
          ? JSON.parse(p.ensemble_probabilities || '{}')
          : p.ensemble_probabilities || {},
      alert_triggered: Boolean(p.alert_triggered),
      recommended_action: '',
    }))
  );
});

router.get('/metrics', (_req, res) => {
  res.json(getMetrics());
});

export default router;
