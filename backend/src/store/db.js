/**
 * File-backed JSON store (no native SQLite – works on Render Node 22)
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Prefer src/data (shipped with repo); fall back to project-root /data on Render disk
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

function emptyState() {
  return {
    users: [],
    stations: [],
    predictions: [],
    alerts: [],
    subscriptions: [],
    seq: { users: 0, stations: 0, predictions: 0, alerts: 0, subscriptions: 0 },
  };
}

let state = emptyState();

function save() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2));
  } catch (e) {
    console.warn('[DB] persist skipped:', e.message);
  }
}

function load() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      state = { ...emptyState(), ...parsed };
      state.seq = { ...emptyState().seq, ...(parsed.seq || {}) };
    }
  } catch {
    state = emptyState();
  }
}

function nextId(key) {
  state.seq[key] = (state.seq[key] || 0) + 1;
  return state.seq[key];
}

export function initDb() {
  load();

  if (!state.stations || state.stations.length === 0) {
    const seed = [
      { name: 'Makurdi', state: 'Benue', latitude: 7.73, longitude: 8.52, river_name: 'Benue River' },
      { name: 'Lokoja', state: 'Kogi', latitude: 7.8, longitude: 6.74, river_name: 'Niger-Benue Confluence' },
      { name: 'Onitsha', state: 'Anambra', latitude: 6.17, longitude: 6.78, river_name: 'River Niger' },
    ];
    state.stations = [];
    for (const s of seed) {
      state.stations.push({ id: nextId('stations'), ...s, is_active: 1 });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@frpews.local';
  if (!state.users.find((u) => u.email === adminEmail)) {
    state.users.push({
      id: nextId('users'),
      email: adminEmail,
      hashed_password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin123!', 10),
      full_name: 'FRPEWS Admin',
      role: 'admin',
      phone: '+2348000000000',
      is_active: 1,
      created_at: new Date().toISOString(),
    });
  }

  save();
  console.log('[DB] Store ready at', DB_FILE, '– stations:', state.stations.length);
}

export const db = {
  findUserByEmail(email) {
    return state.users.find((u) => u.email === email) || null;
  },
  createUser({ email, hashed_password, full_name, phone, role }) {
    const user = {
      id: nextId('users'),
      email,
      hashed_password,
      full_name: full_name || null,
      phone: phone || null,
      role: role || 'community',
      is_active: 1,
      created_at: new Date().toISOString(),
    };
    state.users.push(user);
    save();
    const { hashed_password: _, ...safe } = user;
    return safe;
  },

  listStations() {
    return state.stations.filter((s) => s.is_active);
  },
  getStation(id) {
    return state.stations.find((s) => s.id === Number(id)) || null;
  },
  createStation(data) {
    const row = { id: nextId('stations'), is_active: 1, ...data };
    state.stations.push(row);
    save();
    return row;
  },

  createPrediction(data) {
    const row = {
      id: nextId('predictions'),
      prediction_timestamp: new Date().toISOString(),
      ...data,
    };
    state.predictions.push(row);
    save();
    return row;
  },
  latestPredictions(limit = 20) {
    return [...state.predictions]
      .sort((a, b) => (a.prediction_timestamp < b.prediction_timestamp ? 1 : -1))
      .slice(0, limit);
  },
  stationPredictions(stationId, limit = 10) {
    return [...state.predictions]
      .filter((p) => p.station_id === Number(stationId))
      .sort((a, b) => (a.prediction_timestamp < b.prediction_timestamp ? 1 : -1))
      .slice(0, limit);
  },

  createAlert(data) {
    const row = {
      id: nextId('alerts'),
      created_at: new Date().toISOString(),
      medium: 'SMS',
      ...data,
    };
    state.alerts.push(row);
    save();
    return row;
  },
  listAlerts(limit = 50) {
    return [...state.alerts]
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .slice(0, limit);
  },

  createSubscription(data) {
    const row = {
      id: nextId('subscriptions'),
      user_id: 1,
      is_active: 1,
      min_risk_level: 2,
      ...data,
    };
    state.subscriptions.push(row);
    save();
    return row;
  },
  listSubscriptions() {
    return state.subscriptions.filter((s) => s.is_active);
  },
  activeSubsForStation(stationId, riskClass) {
    return state.subscriptions.filter(
      (s) =>
        s.is_active &&
        s.station_id === Number(stationId) &&
        s.min_risk_level <= riskClass
    );
  },
};
