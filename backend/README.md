# FRPEWS Backend (Node.js 22 LTS)

Express API for **https://flood-risk-system-ten.vercel.app**

## Folder structure

```
src/
├── index.js                 # App entry – mounts all /api routes
├── api/                     # ★ API route files (all endpoints)
│   ├── auth.js
│   ├── stations.js
│   ├── predictions.js
│   ├── alerts.js
│   ├── dashboard.js
│   ├── feeds.js
│   └── index.js
├── data/
│   └── store.json           # ★ Seeded stations (Makurdi, Lokoja, Onitsha)
├── middleware/
│   ├── cors.js              # Allows Vercel frontend
│   ├── auth.js
│   └── errorHandler.js
├── services/
│   ├── mlService.js         # Ensemble RF + temporal model
│   ├── dataFeedService.js   # Open-Meteo live feeds
│   └── twilioService.js     # SMS (demo without keys)
└── store/
    └── db.js                # JSON persistence layer
```

## Local run

```bash
nvm use 22          # or install Node 22
cp .env.example .env
npm install
npm start
# http://localhost:8000/health
# http://localhost:8000/api/stations/
```

## Render deploy

| Setting | Value |
|---------|--------|
| Node version | **22** (`NODE_VERSION=22`) |
| Build | `npm install` |
| Start | `npm start` |

Env:

```
NODE_VERSION=22
NODE_ENV=production
SECRET_KEY=<random>
CORS_ORIGINS=https://flood-risk-system-ten.vercel.app
```

## Vercel frontend

```
VITE_API_URL=https://YOUR-RENDER-URL.onrender.com/api
```

Redeploy frontend after setting this.

## API endpoints

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/api/dashboard/summary` |
| GET | `/api/stations/` |
| POST | `/api/predictions/predict` |
| GET | `/api/predictions/metrics` |
| GET | `/api/feeds/live` |
| GET | `/api/feeds/live/:name` |
| POST | `/api/alerts/send` |
| POST | `/api/alerts/subscribe` |
| GET | `/api/alerts/` |
| POST | `/api/auth/login` |
| POST | `/api/auth/register` |
