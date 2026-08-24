# Architecture — Warehouse AI System

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                         │
│                                                                 │
│   React 18 + React Router 6 + Vite                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │  Pages   │  │Components│  │ Supabase │  │ Google Maps  │  │
│   │  (JSX)   │  │Navbar    │  │  Auth    │  │  JS API      │  │
│   │          │  │Footer    │  │          │  │              │  │
│   └────┬─────┘  └──────────┘  └──────────┘  └──────────────┘  │
└────────┼────────────────────────────────────────────────────────┘
         │ HTTP (fetch / REST)
         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Node.js / Express Backend                    │
│                      http://localhost:5000                      │
│                                                                 │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│   │  /auth   │  │ /predict │  │/optimize │  │ /get-insights│  │
│   │  /data   │  │ -demand  │  │  -route  │  │  /upload     │  │
│   │ /metrics │  │          │  │          │  │  /predict    │  │
│   └──────────┘  └────┬─────┘  └────┬─────┘  └──────────────┘  │
│                       │             │                           │
│              python-shell bridge    │                           │
└───────────────────────┼─────────────┼───────────────────────────┘
                        │             │
                        ▼             ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Python ML Layer                          │
│                                                                 │
│   ┌──────────────────────┐   ┌──────────────────────────────┐  │
│   │  predict_pipeline.py │   │     optimize_route.py        │  │
│   │  RandomForest model  │   │     Dijkstra algorithm       │  │
│   │  pipeline_model.pkl  │   │     Nearest-neighbour TSP    │  │
│   │  pipeline_meta.pkl   │   │                              │  │
│   └──────────────────────┘   └──────────────────────────────┘  │
│                                                                 │
│   ┌──────────────────────┐   ┌──────────────────────────────┐  │
│   │   batch_predict.py   │   │      ml_pipeline.py          │  │
│   │   (file upload)      │   │      (model training)        │  │
│   └──────────────────────┘   └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Frontend Architecture

### Directory Structure

```
Mini-Project/
├── src/
│   ├── main.jsx                  # React root, BrowserRouter
│   ├── App.jsx                   # Route definitions
│   ├── App.css                   # Global layout (padding-top for navbar)
│   ├── index.css                 # CSS variables, reset, animations
│   ├── supabase.js               # Supabase client init
│   ├── supabaseAuth.js           # Auth helpers (login, signup, logout, reset)
│   │
│   ├── components/
│   │   ├── Navbar.jsx / .css     # Fixed top nav, mobile hamburger
│   │   └── Footer.jsx / .css     # Site footer
│   │
│   └── pages/
│       ├── Home.jsx              # Landing page
│       ├── Features.jsx          # Feature cards grid
│       ├── FeatureLearnMore.jsx  # Feature deep-dive
│       ├── SystemModules.jsx     # Module architecture cards
│       ├── ModuleWorkflow.jsx    # Pipeline workflow view
│       ├── ModuleDetails.jsx     # Module detail descriptions
│       ├── Dashboard.jsx         # Live API dashboard (demand + insights)
│       ├── DataExplorer.jsx      # CSV dataset browser
│       ├── ModelTester.jsx       # Batch prediction upload + metrics
│       ├── Login.jsx             # Supabase login
│       ├── ForgotPassword.jsx    # Password reset request
│       ├── ResetPassword.jsx     # Password reset form
│       ├── Contact.jsx           # Contact form
│       │
│       ├── RouteOptimizationDemo.jsx   # Landing — Agent / Admin choice
│       ├── AgentLogin.jsx              # Delivery agent login
│       ├── AgentDashboard.jsx          # Agent view — orders, map, status
│       └── AdminTracking.jsx           # Company live tracking dashboard
│
├── index.html
├── vite.config.js
├── tsconfig.json
└── package.json
```

### Routing Table

```
/                               → Home
/features                       → Features
/features/learn-more            → FeatureLearnMore
/system-modules                 → SystemModules
/system-modules/workflow        → ModuleWorkflow
/system-modules/details         → ModuleDetails
/login                          → Login
/forgot-password                → ForgotPassword
/reset-password                 → ResetPassword
/dashboard                      → Dashboard (protected)
/data                           → DataExplorer (protected)
/model-tester                   → ModelTester (protected)
/contact                        → Contact
/route-optimization             → RouteOptimizationDemo
/route-optimization/agent/login → AgentLogin
/route-optimization/agent/dashboard → AgentDashboard
/route-optimization/admin       → AdminTracking
```

### State & Auth Flow

```
User visits page
      │
      ▼
localStorage.getItem('token')
      │
   exists? ──No──► redirect /login
      │
     Yes
      ▼
Supabase session validated
      │
      ▼
API calls with Bearer token
      │
      ▼
Backend JWT middleware accepts
Supabase tokens (decoded, not verified)
```

---

## Backend Architecture

### Directory Structure

```
backend/
├── server.js              # Express app, CORS, route mounting
├── .env                   # PORT, JWT_SECRET, JWT_EXPIRES_IN
├── package.json
├── requirements.txt       # Python dependencies
│
├── middleware/
│   └── auth.js            # JWT verify (local + Supabase passthrough)
│
├── routes/
│   ├── auth.js            # POST /register, POST /login (in-memory store)
│   ├── demand.js          # POST /predict-demand
│   ├── route.js           # POST /optimize-route
│   ├── insights.js        # POST /get-insights
│   ├── data.js            # GET /summary, GET /:dataset
│   ├── upload.js          # POST /predict (file upload)
│   └── metrics.js         # GET /model-metrics
│
├── ml/
│   ├── ml_pipeline.py           # Train RandomForest, save .pkl files
│   ├── predict_pipeline.py      # Single-row prediction (called by demand.js)
│   ├── batch_predict.py         # Batch prediction from CSV/Excel
│   ├── optimize_route.py        # Dijkstra + nearest-neighbour TSP
│   ├── preprocess.py            # Data cleaning utilities
│   ├── preprocess_supply_chain.py
│   ├── train_demand.py
│   ├── generate_dataset.py
│   └── generate_supply_chain_dataset.py
│
├── models/
│   ├── pipeline_model.pkl       # Trained RandomForest pipeline
│   ├── pipeline_meta.pkl        # Feature names, categories
│   ├── label_encoders.pkl       # Categorical encoders
│   ├── demand_model.pkl         # Legacy demand model
│   └── model_metrics.json       # R², MAE, RMSE, accuracy %
│
├── data/                        # CSV warehouse datasets
│   ├── OrderList.csv
│   ├── FreightRates.csv
│   ├── WarehousePickingData.csv
│   └── ... (16 datasets total)
│
└── uploads/                     # Temp storage for uploaded files
```

### Request Flow — Demand Prediction

```
POST /api/predict-demand
        │
        ▼
auth middleware (JWT verify)
        │
        ▼
demand.js route handler
        │
   Python available?
   + model .pkl exists?
        │
   Yes ─┤                    No
        ▼                     ▼
python-shell spawns      JS rule-based engine
predict_pipeline.py      (predictDemandJS)
        │                     │
        ▼                     ▼
   JSON result ◄──────────────┘
        │
        ▼
  { predicted_demand, engine }
```

### Request Flow — Route Optimization

```
POST /api/optimize-route  { aisles: [3,7,12], start_aisle: 1 }
        │
        ▼
auth middleware
        │
        ▼
route.js handler
        │
   Python available?
        │
   Yes ─┤                    No
        ▼                     ▼
python-shell spawns      JS Dijkstra engine
optimize_route.py        (optimizeRouteJS)
        │                     │
        ▼                     ▼
   JSON result ◄──────────────┘
        │
        ▼
{
  optimized_order: [3, 7, 5, 12],
  full_path: [1, 2, 3, ...],
  total_distance_meters: 87.5,
  estimated_time_minutes: 1.75,
  engine: "python_dijkstra" | "js_dijkstra"
}
```

---

## Route Optimization Demo Architecture

```
RouteOptimizationDemo (/route-optimization)
        │
        ├── AgentLogin (/route-optimization/agent/login)
        │       │
        │       │  localStorage: delivery_agent = { id, name, phone }
        │       ▼
        │   AgentDashboard (/route-optimization/agent/dashboard)
        │       │
        │       ├── Reads assignment from ASSIGNMENTS[agent.id]
        │       ├── Loads Google Maps JS API (script tag)
        │       ├── Calls navigator.geolocation.watchPosition()
        │       ├── Broadcasts location → localStorage: live_agents
        │       ├── Opens Google Maps navigation (new tab)
        │       └── Status: Not Started → In Progress → Delivered
        │
        └── AdminTracking (/route-optimization/admin)
                │
                ├── Polls localStorage: live_agents every 3s
                ├── Merges with DEMO_AGENTS fallback
                ├── Renders Google Maps with agent markers
                ├── Color codes: 🟢 Active, ⚫ Not Started, 🔵 Delivered
                └── Click marker → InfoWindow + detail panel
```

### Real-time Sync (localStorage pub/sub)

```
AgentDashboard                    AdminTracking
      │                                 │
      │  GPS update                     │  setInterval(3000ms)
      │                                 │
      ▼                                 ▼
localStorage.setItem(          localStorage.getItem(
  'live_agents',                 'live_agents'
  { agent_001: {lat,lng,status} }  ) → merge with demo data
)                                        │
                                         ▼
                                   update map markers
```

> Note: localStorage is used for the demo. In production, replace with WebSockets or Firebase Realtime Database for true cross-tab/cross-device sync.

---

## ML Pipeline

```
Raw CSV Data
      │
      ▼
preprocess_supply_chain.py
  - drop nulls
  - encode categoricals (LabelEncoder)
  - feature engineering (rolling avg, seasonality flags)
      │
      ▼
ml_pipeline.py
  - train/test split (80/20)
  - RandomForestRegressor (GridSearchCV tuning)
  - save pipeline_model.pkl + pipeline_meta.pkl
  - save model_metrics.json (R², MAE, RMSE)
      │
      ▼
predict_pipeline.py          batch_predict.py
  (single row inference)       (CSV/Excel batch)
      │                              │
      ▼                              ▼
{ predicted_demand }     { predictions[], metrics{} }
```

---

## CSS Design System

All styles use CSS custom properties defined in `index.css`:

```css
--primary:        #2563eb   /* Blue — buttons, links, accents */
--primary-dark:   #1d4ed8
--primary-light:  #3b82f6
--accent:         #06b6d4   /* Cyan — secondary highlights */
--text:           #1e293b   /* Dark slate */
--text-muted:     #64748b
--bg-gradient-start: #f0f4ff
--bg-gradient-end:   #e8eeff
--card-bg:        #ffffff
--card-shadow:    0 4px 20px rgba(59,130,246,0.08)
--border:         rgba(59,130,246,0.2)
--radius:         12px
--radius-lg:      16px
--transition:     0.3s cubic-bezier(0.4,0,0.2,1)
```
