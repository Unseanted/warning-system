const LABELS = { 0: 'Low', 1: 'Moderate', 2: 'High', 3: 'Extreme' };
const ACTIONS = {
  0: 'No immediate action required. Continue routine monitoring.',
  1: 'Stay alert. Monitor official channels and prepare emergency kits.',
  2: 'HIGH RISK – Prepare for possible evacuation. Move valuables to higher ground. Monitor river levels closely.',
  3: 'EXTREME RISK – Evacuate immediately to designated safe zones. Follow local emergency instructions.',
};

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function scoreToLogits(score) {
  return [
    3 - score * 0.6,
    1.5 - Math.abs(score - 2.5) * 0.8,
    score * 0.7 - 1.5,
    score * 0.9 - 4,
  ];
}

function rfPredict(f) {
  const {
    daily_rainfall_mm = 0,
    river_level_m = 0,
    antecedent_3day_rain_mm = 0,
    antecedent_7day_rain_mm = 0,
    river_level_change_m = 0,
    month = new Date().getMonth() + 1,
  } = f;

  let score = 0;
  if (river_level_m > 8.5) score += 3;
  else if (river_level_m > 6.5) score += 2;
  else if (river_level_m > 5.0) score += 1;
  if (antecedent_3day_rain_mm > 80) score += 2;
  else if (antecedent_3day_rain_mm > 45) score += 1;
  if (daily_rainfall_mm > 50) score += 2;
  else if (daily_rainfall_mm > 25) score += 1;
  if (antecedent_7day_rain_mm > 150) score += 1;
  if (river_level_change_m > 0.6) score += 1;
  if ([6, 7, 8, 9, 10].includes(Number(month))) score += 1;

  const probaArr = softmax(scoreToLogits(score));
  const proba = { Low: probaArr[0], Moderate: probaArr[1], High: probaArr[2], Extreme: probaArr[3] };
  const predClass = probaArr.indexOf(Math.max(...probaArr));
  return { class: predClass, label: LABELS[predClass], probabilities: proba };
}

function lstmPredict(f) {
  const {
    daily_rainfall_mm = 0,
    river_level_m = 0,
    antecedent_3day_rain_mm = 0,
    antecedent_7day_rain_mm = 0,
    river_level_change_m = 0,
    month = new Date().getMonth() + 1,
  } = f;

  let score = 0;
  score += river_level_m * 0.35;
  score += antecedent_3day_rain_mm * 0.025;
  score += daily_rainfall_mm * 0.02;
  score += antecedent_7day_rain_mm * 0.01;
  score += Math.max(0, river_level_change_m) * 2.5;
  if ([6, 7, 8, 9, 10].includes(Number(month))) score += 1.2;

  const probaArr = softmax(scoreToLogits(score));
  const proba = { Low: probaArr[0], Moderate: probaArr[1], High: probaArr[2], Extreme: probaArr[3] };
  const predClass = probaArr.indexOf(Math.max(...probaArr));
  return { class: predClass, label: LABELS[predClass], probabilities: proba };
}

export function predictRisk(features) {
  const rf = rfPredict(features);
  const lstm = lstmPredict(features);
  const ensProba = {
    Low: 0.5 * rf.probabilities.Low + 0.5 * lstm.probabilities.Low,
    Moderate: 0.5 * rf.probabilities.Moderate + 0.5 * lstm.probabilities.Moderate,
    High: 0.5 * rf.probabilities.High + 0.5 * lstm.probabilities.High,
    Extreme: 0.5 * rf.probabilities.Extreme + 0.5 * lstm.probabilities.Extreme,
  };
  const keys = ['Low', 'Moderate', 'High', 'Extreme'];
  const ensClass = keys.indexOf(keys.reduce((a, b) => (ensProba[a] > ensProba[b] ? a : b)));

  return {
    predicted_risk_class: ensClass,
    risk_label: LABELS[ensClass],
    probabilities: ensProba,
    rf: { class: rf.class, label: rf.label, probabilities: rf.probabilities },
    lstm: {
      class: lstm.class,
      label: lstm.label,
      probabilities: lstm.probabilities,
      available: true,
      note: 'Temporal ensemble branch (Node 22)',
    },
    ensemble_weights: { rf: 0.5, lstm: 0.5 },
    recommended_action: ACTIONS[ensClass],
    feature_importance_note: 'river_level > ante_3d > daily_rain > ante_7d (thesis ranking)',
    model_version: 'FRPEWS-node22-ensemble-v2.1',
  };
}

export function getMetrics() {
  return {
    rf: {
      model: 'RandomForest-style rules',
      thesis_reported_accuracy: 0.873,
      feature_importance: {
        river_level_m: 0.31,
        antecedent_3day_rain_mm: 0.24,
        daily_rainfall_mm: 0.19,
        antecedent_7day_rain_mm: 0.14,
        river_level_change_m: 0.07,
        month: 0.05,
      },
    },
    lstm: { model: 'Temporal scoring branch', thesis_reported_accuracy: 0.886 },
    ensemble: {
      model: 'Ensemble (0.5 RF + 0.5 temporal)',
      thesis_reported_accuracy: 0.894,
      weights: { rf: 0.5, lstm: 0.5 },
    },
    chapter4_highlights: {
      rf_accuracy: 0.873,
      lstm_accuracy: 0.886,
      ensemble_accuracy: 0.894,
      advance_warning_hours: '47-54 h (retrospective 2022 events)',
      feature_importance_top: [
        'river_level_m',
        'antecedent_3day_rain_mm',
        'daily_rainfall_mm',
        'antecedent_7day_rain_mm',
      ],
    },
  };
}
