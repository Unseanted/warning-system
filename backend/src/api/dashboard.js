import { Router } from 'express';
import { db } from '../store/db.js';

const router = Router();

router.get('/summary', (_req, res) => {
  const stations = db.listStations();
  const summaries = stations.map((st) => {
    const preds = db.stationPredictions(st.id, 2);
    const latest = preds[0] || null;
    const prev = preds[1] || null;
    let trend = 'stable';
    if (latest && prev) {
      if (latest.predicted_risk_class > prev.predicted_risk_class) trend = 'increasing';
      else if (latest.predicted_risk_class < prev.predicted_risk_class) trend = 'decreasing';
    }
    return {
      station: st,
      latest_prediction: latest
        ? {
            id: latest.id,
            station_id: latest.station_id,
            prediction_timestamp: latest.prediction_timestamp,
            predicted_risk_class: latest.predicted_risk_class,
            risk_label: latest.risk_label,
            probabilities:
              typeof latest.ensemble_probabilities === 'string'
                ? JSON.parse(latest.ensemble_probabilities || '{}')
                : latest.ensemble_probabilities || {},
            alert_triggered: Boolean(latest.alert_triggered),
            recommended_action: '',
          }
        : null,
      trend,
    };
  });
  res.json(summaries);
});

export default router;
