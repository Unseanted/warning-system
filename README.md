# FRPEWS v2 — Flood Risk Prediction & Early Warning System

Modern full-stack rebuild of the final-year thesis prototype for **vulnerable Nigerian communities** (Makurdi, Lokoja, Onitsha).

| Layer | Stack |
|-------|--------|
| **Backend** | **Node.js** + Express + better-sqlite3 |
| **Frontend** | React 18 + Vite + Tailwind (**shadcn-style** UI) + **GSAP** climate animations |
| **Models** | RF-style rules + temporal branch → **ensemble 0.5 / 0.5** |
| **Feeds** | Open-Meteo (live) · NiMet path documented |
| **SMS** | Twilio (demo mode without credentials) |
| **Deploy** | **Render.com** (API) · **Vercel** (UI) |

Thesis-aligned metrics (Chapter 4): RF **87.3%** · LSTM **88.6%** · Ensemble **89.4%**.

---

## Repository layout

```
frpews-node/
├── backend/                 # Node.js API
│   ├── src/
│   │   ├── index.js
│   │   ├── db/database.js
│   │   ├── routes/          # auth, stations, predictions, alerts, dashboard, feeds
│   │   └── services/        # mlService, twilioService, dataFeedService
│   ├── package.json
│   └── .env.example
├── frontend/                # React app
│   ├── src/
│   │   ├── pages/
│   │   ├── components/      # Layout, WeatherScene (GSAP)
│   │   └── ui/              # Button, Card, Badge, Input (shadcn-style)
│   └── package.json
└── README.md
```

---

## Local development

### Prerequisites
- **Node.js 18+** ([nodejs.org](https://nodejs.org))
- Optional: Twilio account for live SMS

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run dev
# → http://localhost:8000
# → http://localhost:8000/health
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

The Vite dev server proxies `/api` to `localhost:8000`. For a remote API:

```bash
# frontend/.env.local
VITE_API_URL=http://localhost:8000/api
```

---

## API surface (same contracts as previous Python API)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/dashboard/summary` | Station risk cards |
| GET | `/api/stations/` | Study areas |
| POST | `/api/predictions/predict` | Ensemble prediction |
| GET | `/api/predictions/metrics` | Chapter 4 metrics |
| GET | `/api/feeds/live` | Live Open-Meteo features |
| GET | `/api/feeds/live/:name` | One station live feed |
| POST | `/api/alerts/send` | Manual SMS |
| POST | `/api/alerts/subscribe` | Subscribe phone |
| GET | `/api/alerts/` | Alert log |
| POST | `/api/auth/login` | JWT login |
| POST | `/api/auth/register` | Register |

Default admin: `admin@frpews.local` / `Admin123!`

---

## Deploy: Render.com (backend)

1. Push this repo to GitHub.
2. **Render → New → Web Service** → connect the repo.
3. Settings:

| Field | Value |
|-------|--------|
| **Root Directory** | `backend` |
| **Runtime** | Node |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance** | Free is fine for demos |

4. **Environment variables**

| Key | Value |
|-----|--------|
| `NODE_ENV` | `production` |
| `SECRET_KEY` | long random string |
| `CORS_ORIGINS` | `https://YOUR-APP.vercel.app` (comma-separate multiple) |
| `TWILIO_ACCOUNT_SID` | optional |
| `TWILIO_AUTH_TOKEN` | optional |
| `TWILIO_PHONE_NUMBER` | optional |

5. Deploy → copy the service URL, e.g.  
   `https://frpews-api.onrender.com`

6. Verify:  
   `https://frpews-api.onrender.com/health` → `{"status":"healthy"}`

> **Note:** Free Render services spin down after idle time. The first request after sleep can take 30–60 seconds.

### Native module note (`better-sqlite3`)

Render builds native addons on Linux by default. If install fails, ensure:

- Node version **18 or 20** (set in Render → Environment → `NODE_VERSION=20`)
- Build uses the same OS as runtime (standard Web Service does)

---

## Deploy: Vercel (frontend)

1. **Vercel → Add New Project** → import the same repo.
2. Settings:

| Field | Value |
|-------|--------|
| **Root Directory** | `frontend` |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

3. **Environment variables** (Production + Preview):

| Key | Value |
|-----|--------|
| `VITE_API_URL` | `https://YOUR-RENDER-URL.onrender.com/api` |

Must include the **`/api`** suffix.

4. Deploy. After each change to env vars, **Redeploy** so Vite embeds the new URL at build time.

5. Open the Vercel URL → Dashboard should load station cards from Render.

---

## Connecting frontend ↔ backend

```
Browser
  └─ https://your-app.vercel.app     (React)
         │  VITE_API_URL
         ▼
     https://frpews-api.onrender.com/api/...  (Express)
```

Checklist:

1. Backend healthy at `/health`
2. `VITE_API_URL` ends with `/api`
3. `CORS_ORIGINS` on Render includes the exact Vercel origin (`https://….vercel.app`)
4. Frontend redeployed after setting the env var
5. Browser Network tab shows calls to the Render host (not localhost)

---

## Features retained from the thesis app

- Three study areas seeded (Makurdi, Lokoja, Onitsha)
- Ensemble risk classes: Low / Moderate / High / Extreme
- Feature ranking message aligned with Chapter 4
- Live meteorological feed (Open-Meteo) + “Load live feed” on Predict
- Auto SMS on High/Extreme for subscribers; manual send + subscribe UI
- Dashboard trends, probability bars, metrics strip
- Auth register/login endpoints (JWT)

---

## UI / animation notes

- Dark glassmorphism cards, Outfit + Inter typography
- shadcn-inspired primitives (`Button`, `Card`, `Badge`, `Input`) under `src/ui`
- GSAP `WeatherScene`: drifting clouds, rain drops, sky glow (ambient climate motion)

---

## License

Academic / educational use — Final Year Project prototype.
