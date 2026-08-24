# 🏭 Next-Gen Warehouse Optimization with AI

A full-stack AI-powered warehouse management system built as a final-year college project (AIDS, YCCE Nagpur).

---

## 🚀 How to Run

Open **two terminals** and run:

**Terminal 1 — Backend**
```bash
cd "MiniProject AIDS YCCE/backend"
npm install
node server.js
```

**Terminal 2 — Frontend**
```bash
cd "MiniProject AIDS YCCE/Mini-Project"
npm install
npm run dev
```

Open your browser at **http://localhost:5173**

> First time? Run `pip install -r requirements.txt` in the backend folder to enable Python ML predictions.

---

## 🔑 Demo Credentials

### Main Login (Warehouse Manager)
Register a new account at `/login` using any email and password (min 6 chars).  
Email confirmation is disabled — login works immediately after registration.

### Delivery Agent Login
| Email | Password | Agent |
|---|---|---|
| `amit@warehouse.com` | `agent123` | Amit Kumar |
| `rahul@warehouse.com` | `agent123` | Rahul Sharma |
| `neha@warehouse.com` | `agent123` | Neha Patel |

---

## 📋 Pages & Features

| Page | Route | Description |
|---|---|---|
| Home | `/` | Landing page with project overview |
| Features | `/features` | AI features overview |
| System Modules | `/system-modules` | Pipeline architecture |
| Dashboard | `/dashboard` | ML demand forecasting + route optimization + AI insights |
| Datasets | `/data` | Browse all 12 warehouse CSV datasets |
| Model Tester | `/model-tester` | Upload CSV and run batch ML predictions |
| Explainable AI | `/explainable-ai` | Public delivery tracker + company AI chatbot |
| Cost Reduction | `/cost-reduction` | Operational cost savings calculator |
| Route Optimization | `/route-optimization` | Delivery agent system |
| Agent Login | `/route-optimization/agent/login` | Delivery agent login |
| Agent Dashboard | `/route-optimization/agent/dashboard` | Agent delivery tracker with proof of delivery |
| Admin Tracking | `/route-optimization/admin` | Company live delivery monitoring dashboard |
| Contact | `/contact` | Contact form (backend connected) |

---

## 🧠 AI & ML Pipeline

```
Warehouse CSV Datasets (12 files)
        ↓
Preprocessing (pandas, scikit-learn Pipeline)
        ↓
RandomForestRegressor — Demand Forecasting
  • 94.37% accuracy  |  R² = 0.9437
  • MAE = 4.91 units  |  RMSE = 6.21 units
  • Trained on 36,550 records
        ↓
Dijkstra's Algorithm — Route Optimization
  • Shortest picking path across warehouse aisles
  • 27–38% distance reduction
        ↓
AI Insights Engine — Rule-based + OpenAI GPT
  • Explains predictions in plain language
  • Hybrid: GPT when available, rule engine fallback
        ↓
Company Dashboard — Live KPIs + Agent Tracking
```

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + React Router 6 |
| Backend | Node.js + Express 5 |
| Database / Auth | Supabase (PostgreSQL + Auth) |
| ML | Python 3 + scikit-learn + pandas + numpy |
| ML Serving | joblib (.pkl files) called via python-shell |
| Agent Auth | Local JWT (`AGENT_JWT_SECRET`) |
| AI Chat | OpenAI GPT-3.5 + Gemini + rule-based fallback |
| Data Persistence | JSON files (`backend/data/*.json`) |
| Styling | Plain CSS (no UI framework) |

---

## 📁 Project Structure

```
MiniProject AIDS YCCE/
├── backend/                        Node.js + Express API
│   ├── data/                       12 warehouse CSV datasets + JSON state files
│   ├── middleware/
│   │   └── auth.js                 JWT middleware (Supabase + Agent tokens)
│   ├── ml/                         Python ML scripts
│   │   ├── ml_pipeline.py          Train RandomForest model
│   │   ├── predict_pipeline.py     Single prediction
│   │   ├── batch_predict.py        Batch CSV prediction
│   │   └── optimize_route.py       Dijkstra route optimizer
│   ├── models/                     Trained .pkl files + model_metrics.json
│   ├── routes/
│   │   ├── agentAuth.js            Agent login + company dashboard + public tracker APIs
│   │   ├── auth.js                 Supabase auth proxy
│   │   ├── chat.js                 Hybrid AI chatbot (Gemini / OpenAI / rule engine)
│   │   ├── contact.js              Contact form endpoint
│   │   ├── data.js                 CSV dataset browser
│   │   ├── demand.js               ML demand prediction
│   │   ├── insights.js             AI insights generator
│   │   ├── metrics.js              Model metrics endpoint
│   │   ├── route.js                Dijkstra route optimization
│   │   └── upload.js               Batch CSV prediction upload
│   ├── .env                        Environment variables
│   ├── package.json
│   ├── requirements.txt            Python dependencies
│   └── server.js                   Express app entry point
│
└── Mini-Project/                   React frontend
    ├── src/
    │   ├── supabase.js             Supabase client
    │   ├── supabaseAuth.js         Auth helper functions
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   └── Footer.jsx
    │   └── pages/
    │       ├── Login.jsx           Supabase login + register
    │       ├── ForgotPassword.jsx
    │       ├── ResetPassword.jsx
    │       ├── Dashboard.jsx       ML dashboard
    │       ├── ModelTester.jsx     Batch prediction tester
    │       ├── DataExplorer.jsx    CSV dataset browser
    │       ├── ExplainableAI.jsx   Public tracker + company chatbot
    │       ├── CostReduction.jsx   Cost savings calculator
    │       ├── AgentLogin.jsx      Delivery agent login
    │       ├── AgentDashboard.jsx  Agent delivery dashboard
    │       ├── AdminTracking.jsx   Company monitoring dashboard
    │       ├── Contact.jsx         Contact form
    │       └── ...                 Static info pages
    ├── package.json
    └── vite.config.js
```

---

## 🌐 API Reference

### Public (no auth required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/agent/login` | Delivery agent login |
| GET | `/api/agent/status/:id` | Get agent delivery status |
| POST | `/api/agent/status` | Update delivery status |
| GET | `/api/agent/company/dashboard` | Live company dashboard data |
| GET | `/api/agent/company/order/:agentId` | Full order details |
| GET | `/api/agent/public/order/:orderId` | Public delivery tracker |
| GET | `/api/agent/public/order/:orderId/status` | Live status poll |
| POST | `/api/contact` | Submit contact form |
| GET | `/api/model-metrics` | ML model performance metrics |
| GET | `/api/stats` | Live dataset statistics |
| GET | `/api/health` | Health check |

### Protected (Bearer token required)
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/predict-demand` | ML demand prediction |
| POST | `/api/optimize-route` | Dijkstra route optimization |
| POST | `/api/get-insights` | AI insights generation |
| POST | `/api/upload/predict` | Batch CSV prediction |
| GET | `/api/data/:dataset` | Browse CSV datasets |
| GET | `/api/data/stats` | Dataset statistics |
| POST | `/api/chat` | Hybrid AI chatbot |

---

## ⚙️ Environment Variables

**`backend/.env`**
```
PORT=5000
SUPABASE_URL=https://jswwisxjytkxdvvnnzxy.supabase.co
SUPABASE_ANON_KEY=<your-supabase-anon-key>
AGENT_JWT_SECRET=agent_jwt_secret_replace_in_production_min32chars!!
AGENT_JWT_EXPIRES_IN=24h
OPENAI_API_KEY=<your-openai-key-optional>
GEMINI_API_KEY=<your-gemini-key-optional>
PYTHON_PATH=python
```

> OpenAI and Gemini keys are optional. The chatbot falls back to the rule-based engine automatically if no key is set.

---

## 📊 Data Persistence

Agent statuses, GPS locations, and proof of delivery are persisted to JSON files in `backend/data/`:

| File | Contents |
|---|---|
| `agent_statuses.json` | Delivery status per agent (survives restarts) |
| `agent_locations.json` | Last known GPS coordinates per agent |
| `proof_of_delivery.json` | Submitted delivery proofs (photo, notes, signature) |

These files are created automatically on first run.

---

## 🔄 Demo Flow

**Full end-to-end demo sequence:**

1. Open `http://localhost:5173` → Home page
2. **Login** → register or use existing account
3. **Dashboard** → predict demand → optimize route → get AI insights
4. **Datasets** → browse warehouse CSV data
5. **Model Tester** → download sample CSV → upload → see R² / MAE / RMSE
6. **Explainable AI** → Public Tracker → enter `ORD-2024-001` → see live status
7. **Explainable AI** → Company Login → open AI chatbot modules
8. **Cost Reduction** → change scenario → see savings calculator + AI chat
9. **Route Optimization** → Agent Login (`amit@warehouse.com / agent123`) → start delivery → update status → submit proof
10. **Admin Tracking** → Company Dashboard → see all 3 agents + live status → click agent → see full order detail

---

## 📦 ML Model Details

| Property | Value |
|---|---|
| Algorithm | RandomForestRegressor (100 trees) |
| Target | `demand` (units) |
| Features | 12 (inventory, price, category, location, time features) |
| Training set | 29,240 rows (80%) |
| Test set | 7,310 rows (20%) |
| Accuracy (R²) | 94.37% |
| MAE | 4.91 units |
| RMSE | 6.21 units |

To retrain the model:
```bash
cd backend
python ml/ml_pipeline.py
```

---

## 📝 Version

- Frontend: React 18.3.1 + Vite 7.3.1
- Backend: Express 5.2.1 + Node.js v24
- Auth: Supabase Auth + Agent JWT
- ML: scikit-learn 1.3+ + pandas 2.0+ + numpy 1.24+
- Python: 3.9+
