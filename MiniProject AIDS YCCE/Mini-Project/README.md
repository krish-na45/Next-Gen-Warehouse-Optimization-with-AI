# Warehouse AI — Next-Gen Supply Chain Optimization

A full-stack AI-powered warehouse management system with demand forecasting, route optimization, live delivery tracking, and explainable AI insights.

## Tech Stack

**Frontend**
- React 18 (JSX) + React Router 6
- Vite
- Plain CSS with CSS variables
- Supabase (auth)
- Google Maps JavaScript API (route optimization demo)

**Backend**
- Node.js + Express 5
- Python (scikit-learn RandomForest, Dijkstra route optimizer)
- python-shell (Node ↔ Python bridge)
- JWT authentication
- multer (file uploads)

---

## Getting Started

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Runs on `http://localhost:5000`

> Requires Python with `scikit-learn`, `pandas`, `numpy` installed.
> Run `pip install -r requirements.txt` to install Python dependencies.
> To train the ML model: `python ml/ml_pipeline.py`

### 2. Frontend

```bash
cd Mini-Project
npm install
npm run dev
```

Runs on `http://localhost:5173`

---

## Pages & Features

### Public
| Route | Description |
|---|---|
| `/` | Home — hero, project overview, highlights |
| `/features` | Feature cards — forecasting, picking optimization, LLM, cost reduction |
| `/system-modules` | Architecture modules with workflow and detail views |
| `/contact` | Contact form |

### Auth
| Route | Description |
|---|---|
| `/login` | Supabase email/password login |
| `/forgot-password` | Password reset request |
| `/reset-password` | Set new password via email link |

### Protected (requires login)
| Route | Description |
|---|---|
| `/dashboard` | Live dashboard — demand forecasting + AI insights connected to backend |
| `/data` | Dataset explorer — browse all warehouse CSV datasets |
| `/model-tester` | Upload CSV/Excel, run batch ML predictions, compare metrics |

### Route Optimization Demo
| Route | Description |
|---|---|
| `/route-optimization` | Landing page — choose Delivery Agent or Company Dashboard |
| `/route-optimization/agent/login` | Agent login (demo: `agent1@warehouse.com` / `agent123`) |
| `/route-optimization/agent/dashboard` | Agent view — order details, optimized route, GPS tracking, status updates |
| `/route-optimization/admin` | Company dashboard — live map with all agents, stats, filter by status |

---

## Backend API

All protected routes require `Authorization: Bearer <token>` header.

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Register user |
| POST | `/api/auth/login` | Public | Login, returns JWT |
| GET | `/api/model-metrics` | Public | Trained model performance stats |
| POST | `/api/predict-demand` | Protected | Run demand prediction (Python RF or JS fallback) |
| POST | `/api/optimize-route` | Protected | Dijkstra route optimization |
| POST | `/api/get-insights` | Protected | LLM-style AI insights |
| GET | `/api/data/:dataset` | Protected | Browse warehouse CSV datasets |
| POST | `/api/upload/predict` | Protected | Batch predict from uploaded CSV/Excel |
| GET | `/api/health` | Public | Health check |

---

## ML Models

| Model | File | Description |
|---|---|---|
| Demand Forecasting | `models/pipeline_model.pkl` | RandomForestRegressor pipeline |
| Label Encoders | `models/label_encoders.pkl` | Categorical encoders |
| Metrics | `models/model_metrics.json` | R², MAE, RMSE, accuracy % |

If Python is unavailable, the backend automatically falls back to a JS rule-based engine for both demand prediction and route optimization.

---

## Route Optimization Demo

The demo simulates a real delivery workflow:

- **Delivery Agent Panel** — agents log in, view assigned orders, get Google Maps navigation from warehouse to customer, update delivery status (Not Started / In Progress / Delivered), and broadcast GPS location in real time via localStorage.
- **Company Dashboard** — admins see all agents on a live map, filter by status, click markers for route/progress/ETA details, and view summary stats.

To enable Google Maps, replace `YOUR_GOOGLE_MAPS_API_KEY` in:
- `src/pages/AgentDashboard.jsx`
- `src/pages/AdminTracking.jsx`

Without a key, the agent dashboard falls back to opening Google Maps in a new tab, and the admin panel shows a placeholder.

---

## Build for Production

```bash
cd Mini-Project
npm run build
npm run preview
```
