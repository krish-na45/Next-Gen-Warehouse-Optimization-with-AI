# ⚡ QUICK REFERENCE — Warehouse AI

## Start the App

| Step | Terminal | Command |
|------|----------|---------|
| 1 | Terminal 1 | `cd backend && npm run dev` |
| 2 | Terminal 2 | `cd Mini-Project && npm run dev` |
| 3 | Browser | Open `http://localhost:5173` |

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | ❌ | Register user |
| POST | `/api/auth/login` | ❌ | Login, returns JWT |
| POST | `/api/predict-demand` | ✅ | ML demand forecast |
| POST | `/api/optimize-route` | ✅ | Dijkstra route optimizer |
| POST | `/api/get-insights` | ✅ | AI recommendations |
| GET  | `/api/data/summary` | ✅ | Dataset metadata |
| GET  | `/api/data/:dataset` | ✅ | Browse CSV datasets |
| POST | `/api/upload/predict` | ✅ | Batch predict from file |
| GET  | `/api/health` | ❌ | Server health check |

---

## Frontend Pages

| URL | Page | Login Required |
|-----|------|----------------|
| `/` | Home | ❌ |
| `/login` | Login / Register | ❌ |
| `/dashboard` | Live Dashboard | ✅ |
| `/data` | Dataset Explorer | ✅ |
| `/model-tester` | Model Tester (upload) | ✅ |
| `/features` | Features Overview | ❌ |
| `/system-modules` | System Modules | ❌ |
| `/contact` | Contact | ❌ |

---

## ML Models

| Model | File | Engine |
|-------|------|--------|
| Demand Forecast | `models/pipeline_model.pkl` | Random Forest (sklearn) |
| Label Encoders | `models/label_encoders.pkl` | LabelEncoder |
| Pipeline Meta | `models/pipeline_meta.pkl` | Column alignment info |

---

## Key Files

```
backend/
  server.js               → Express app entry point
  .env                    → PORT, JWT_SECRET, JWT_EXPIRES_IN
  routes/demand.js        → POST /api/predict-demand
  routes/route.js         → POST /api/optimize-route
  routes/insights.js      → POST /api/get-insights
  routes/upload.js        → POST /api/upload/predict
  routes/data.js          → GET  /api/data/*
  middleware/auth.js      → JWT validation
  ml/predict_pipeline.py  → Single prediction script
  ml/batch_predict.py     → Batch prediction script
  ml/ml_pipeline.py       → Train + evaluate model
  ml/optimize_route.py    → Dijkstra algorithm

Mini-Project/src/
  supabase.js             → Supabase client config
  supabaseAuth.js         → Auth helper functions
  pages/Dashboard.jsx     → Main AI dashboard
  pages/ModelTester.jsx   → Upload & batch predict
  pages/DataExplorer.jsx  → Browse datasets
  pages/Login.jsx         → Login / Register
```

---

## Environment Variables (backend/.env)

```env
PORT=5000
JWT_SECRET=warehouse_ai_secret_key_change_in_production
JWT_EXPIRES_IN=24h
PYTHON_PATH=C:\Users\LENOVO\anaconda3\python.exe   # optional override
```

---

## Prediction Input Fields

```json
{
  "product_id": "P001",
  "warehouse_location": "Zone-A",
  "category": "Electronics",
  "aisle_number": 3,
  "inventory_level": 250,
  "reorder_point": 80,
  "lead_time_days": 5,
  "unit_price": 199.99,
  "day_of_week": 2,
  "month": 4,
  "is_weekend": 0
}
```

---

## Engine Labels (Dashboard)

| Label | Meaning |
|-------|---------|
| 🐍 Python Random Forest | sklearn pipeline model (best) |
| 🐍 Python Dijkstra | Python route optimizer |
| ⚡ JS Rule Engine | JS fallback for demand |
| ⚡ JS Dijkstra | JS fallback for routes |
| ⚡ JS Fallback | Python failed, JS used |
