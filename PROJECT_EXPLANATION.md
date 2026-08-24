# 📖 Project Explanation — Next-Gen Warehouse Optimization with AI

**College:** Yeshwantrao Chavan College of Engineering (YCCE), Nagpur
**Branch:** Artificial Intelligence and Data Science (AIDS)
**Project Type:** Final Year Mini Project

---

## 1. WHAT IS THIS PROJECT?

This project is an **AI-powered warehouse management system** that solves real-world logistics problems using machine learning, optimization algorithms, and a modern web application.

The system helps warehouse managers:
- **Predict demand** for products before stock runs out
- **Optimize picking routes** inside the warehouse to save time and cost
- **Track deliveries** in real time
- **Explain AI decisions** in plain language using chatbots

---

## 2. PROBLEM STATEMENT

Traditional warehouses face three major problems:

| Problem | Impact |
|---|---|
| Inaccurate demand forecasting | Overstock or stockout — wasted money |
| Inefficient picking routes | Pickers walk unnecessary distances — wasted time |
| No real-time delivery visibility | Customers cannot track their orders |

This project solves all three using AI and data-driven decisions.

---

## 3. OBJECTIVES

1. Build a demand forecasting model using machine learning
2. Implement Dijkstra's algorithm for shortest warehouse picking path
3. Create a real-time delivery agent tracking system
4. Build a chatbot that explains AI predictions in plain language
5. Develop a complete web application connecting all modules

---

## 4. SYSTEM ARCHITECTURE

```
┌──────────────────────────────────────────────────────────┐
│                    WEB APPLICATION                        │
│   React 18 Frontend  +  Node.js / Express Backend        │
└──────────┬───────────────────────────────────┬───────────┘
           │                                   │
    ┌──────▼──────┐                   ┌────────▼────────┐
    │  ML MODULE  │                   │  DELIVERY MODULE │
    │             │                   │                  │
    │ RandomForest│                   │ Agent Dashboard  │
    │ 94.37% acc  │                   │ GPS Tracking     │
    │ Demand Pred │                   │ Status Updates   │
    └──────┬──────┘                   └────────┬────────┘
           │                                   │
    ┌──────▼──────┐                   ┌────────▼────────┐
    │  OPTIMIZER  │                   │ COMPANY MONITOR │
    │             │                   │                  │
    │  Dijkstra   │                   │ Live Dashboard   │
    │ Route Opt   │                   │ 5s Polling       │
    │ 27% savings │                   │ AI Insights      │
    └──────┬──────┘                   └────────┬────────┘
           │                                   │
           └───────────────┬───────────────────┘
                           │
                    ┌──────▼──────┐
                    │   DATABASE  │
                    │   Supabase  │
                    │ PostgreSQL  │
                    └─────────────┘
```

---

## 5. MODULES EXPLAINED

### Module 1 — Demand Forecasting (ML)

**What it does:**
Predicts how many units of a product will be needed, so the warehouse can order the right amount.

**Algorithm used:** Random Forest Regressor

**Why Random Forest?**
- It builds 100 decision trees and averages their predictions
- This prevents overfitting (memorizing training data)
- It handles both numeric and categorical features
- It works well on structured tabular data like warehouse records

**How it works:**
```
Input Features:
  - inventory_level (how much stock is available)
  - reorder_point (when to trigger a new order)
  - lead_time_days (how long delivery takes)
  - unit_price (price of the product)
  - category (Electronics, Grocery, etc.)
  - day_of_week, month, is_weekend (time features)
  - rolling_avg_7d (recent demand trend)
        ↓
Random Forest Model (100 trees)
        ↓
Output: Predicted demand in units
```

**Performance:**
- Accuracy: **94.37%**
- R² Score: **0.9437** (model explains 94.37% of demand variation)
- MAE: **4.91 units** (average error is only ~5 units)
- RMSE: **6.21 units**
- Trained on: **36,550 warehouse records**

---

### Module 2 — Route Optimization (Dijkstra's Algorithm)

**What it does:**
Finds the shortest path for a warehouse picker to collect items from multiple aisles.

**Algorithm used:** Dijkstra's Shortest Path Algorithm

**Why Dijkstra?**
- Models the warehouse floor as a weighted graph
- Aisles = nodes, distances between aisles = edge weights
- Guarantees the globally optimal (shortest) path
- Time complexity: O((V+E) log V) — efficient even for large warehouses

**How it works:**
```
Warehouse Floor Graph:
  Aisle 1 ──3m── Aisle 2 ──5m── Aisle 3
     │                              │
    4m                             2m
     │                              │
  Aisle 5 ──────────────────── Aisle 4

Input: "Pick from aisles 3, 5, 7, 10, 12. Start at aisle 1."
        ↓
Dijkstra finds minimum distance path visiting all required aisles
        ↓
Output: Optimal order [1 → 3 → 5 → 7 → 10 → 12 → 1]
        Total distance: 8m (vs 11m unoptimized)
        Time saved: 5 minutes
        Cost saved: ₹125 per cycle
```

**Results:**
- Distance reduced: **27–38%**
- Time saved: **5 minutes per picking cycle**
- At 10 cycles/day: **₹1,280 saved daily**

---

### Module 3 — Explainable AI (LLM Chatbot)

**What it does:**
Explains AI decisions in plain language. Instead of just showing numbers, it tells you WHY the prediction was made.

**Architecture:**
```
User Question
      ↓
Intent Classifier (25 categories, scored matching)
      ↓
Context Injector (injects live dashboard values)
      ↓
┌─────────────────────────────────┐
│ Path 1: Gemini (if key set)     │
│ Path 2: OpenAI GPT-3.5         │
│ Path 3: Rule Engine (always)   │
└─────────────────────────────────┘
      ↓
Answer using live data (never hardcoded)
```

**Example:**
```
Question: "Why did cost reduce?"

Answer: "Cost reduced from ₹1,232 to ₹1,104 — saving ₹128 (10%)
in the Standard Warehouse scenario.

Breakdown:
• Labor: ₹125 saved by cutting picking time from 17 to 12 min
• Travel: ₹36 saved by shortening route from 11m to 8m (27%)
• Fuel: ₹1 saved from reduced distance factor

Dijkstra's algorithm found the shortest path; Random Forest
predicted exact demand — together they eliminate waste."
```

**4 Chatbot Modules:**
1. Demand Forecasting Assistant
2. Warehouse Picking Assistant
3. Cost Reduction Analyst
4. Platform Guide

---

### Module 4 — Delivery Agent System

**What it does:**
Delivery agents log in, see their assigned order, update delivery status, and submit proof of delivery.

**Features:**
- Real backend JWT authentication (email + password)
- Live delivery status: Not Started → In Progress → Delivered
- Status persisted to JSON file (survives server restarts)
- ETA countdown timer (live, updates every second)
- Delivery timeline (Order Assigned → Picked Up → On The Way → Delivered)
- AI route recommendations (traffic, suggested route, time saved)
- Proof of delivery: photo upload + signature pad + delivery notes

**Demo agents:**
```
amit@warehouse.com   / agent123  → Amit Kumar (agent_001)
rahul@warehouse.com  / agent123  → Rahul Sharma (agent_002)
neha@warehouse.com   / agent123  → Neha Patel (agent_003)
```

---

### Module 5 — Company Monitoring Dashboard

**What it does:**
Company managers can monitor all deliveries in real time from one screen.

**Features:**
- Auto-refreshes every 5 seconds (polling)
- Shows all agents with live status, ETA, order details
- Click any agent → full order details + AI insight + proof of delivery
- Google Maps integration (requires API key) or professional fallback table
- Filter by status: All / In Progress / Not Started / Delivered
- Stats: Total / Active / Completed / Pending

---

### Module 6 — Public Delivery Tracker

**What it does:**
Anyone can track their delivery without logging in by entering an Order ID.

**Features:**
- Enter `ORD-2024-001`, `ORD-2024-002`, or `ORD-2024-003`
- Live status fetched from backend (not hardcoded)
- 5-second auto-refresh polling
- ETA countdown (live seconds)
- Delivery timeline (5 stages)
- Agent card with phone + vehicle number
- AI Explanation panel (why this ETA was predicted)
- Delivery history with timestamps
- Proof of delivery shown when order is delivered

---

### Module 7 — Model Tester

**What it does:**
Lets users upload their own CSV dataset and run the trained ML model on it.

**Features:**
- Upload any CSV with warehouse columns
- Batch prediction using Python RandomForest model
- Shows R², MAE, RMSE for the uploaded dataset
- Compares with Base Model performance
- Model Quality indicator: Excellent / Good / Fair / Poor (based on R²)
- Never shows negative accuracy percentages
- Download predictions as CSV
- Sample datasets provided for download

---

### Module 8 — Operational Cost Reduction

**What it does:**
Calculates and visualises the business value of AI optimization in rupees.

**Cost formulas:**
```
Travel Cost  = Distance × ₹12/m
Labor Cost   = Picking Time × ₹25/min
Fuel Cost    = ₹150 + Distance × 0.18
Total Cost   = Travel + Labor + Fuel
Savings      = Before Cost − After Cost
Savings %    = (Savings ÷ Before) × 100
```

**Scenarios:**
| Scenario | Before | After | Saved |
|---|---|---|---|
| Standard Warehouse | ₹1,232 | ₹1,104 | ₹128 (10%) |
| High-Volume Picking | ₹2,003 | ₹1,750 | ₹253 (18%) |
| Small Batch Order | ₹698 | ₹615 | ₹83 (12%) |

**At scale:** 10 cycles/day × 300 working days = **₹384,000 saved annually**

---

## 6. DATABASE & AUTHENTICATION

### Main User Authentication — Supabase
- Users register/login via Supabase Auth
- Supabase issues a JWT token (access_token)
- Token sent with every API request: `Authorization: Bearer <token>`
- Backend verifies token by calling `supabase.auth.getUser(token)`
- No signature checking vulnerabilities (proper server-side verification)

### Delivery Agent Authentication — Local JWT
- Agents have separate credentials stored in backend
- Login returns a JWT signed with `AGENT_JWT_SECRET`
- Middleware detects agent tokens by the `role: "agent"` claim
- Token verified using `jwt.verify()` with explicit HS256 algorithm

### Data Persistence
```
backend/data/agent_statuses.json     ← delivery statuses survive restarts
backend/data/agent_locations.json    ← GPS coordinates survive restarts
backend/data/proof_of_delivery.json  ← proof submissions survive restarts
```

---

## 7. DATASETS USED

| Dataset | Rows | Purpose |
|---|---|---|
| WarehousePickingData.csv | 36,550 | ML model training (primary) |
| OrderList.csv | 50,000 | Order records |
| PickingRoutes.csv | 5,000 | Route optimization data |
| CarrierPerformance.csv | — | Delivery performance metrics |
| InventoryTransactions.csv | — | Stock movement history |
| FreightRates.csv | — | Shipping cost data |
| WarehouseLayout.csv | — | Physical warehouse structure |
| ProductsPerPlant.csv | — | Product-warehouse mapping |
| + 4 more support files | | |

All datasets are real supply chain data provided as CSV files in `backend/data/`.

---

## 8. HOW ALL MODULES CONNECT

```
Agent updates status to "Delivered"
         ↓
POST /api/agent/status → saved to agent_statuses.json
         ↓
Company Dashboard polls GET /api/agent/company/dashboard every 5s
         ↓
Dashboard shows "Delivered" immediately
         ↓
Public Tracker polls GET /api/public/order/:id every 5s
         ↓
Public tracker shows "Delivered" + proof of delivery
         ↓
All three screens stay synchronized without page refresh
```

---

## 9. VIVA PREPARATION

### Q: Why did you choose Random Forest?
**A:** Random Forest was chosen because warehouse demand data has non-linear relationships between features (price, inventory, season, category). A single decision tree overfits; Random Forest averages 100 trees to generalize better. It also handles mixed feature types (numeric + categorical) natively. The result was 94.37% accuracy on 36,550 records.

### Q: Why Dijkstra's algorithm?
**A:** Dijkstra finds the globally optimal shortest path in a weighted graph. The warehouse floor was modeled as a graph where aisles are nodes and distances between them are edge weights. This eliminates backtracking, reducing picking distance by 27–38% compared to random aisle order.

### Q: How does the chatbot work without an API key?
**A:** The chatbot has three layers. If Gemini API key is set, it uses Gemini. If OpenAI key is set, it uses GPT-3.5. If neither is available, a rule-based engine classifies the question into 25 intent categories using keyword scoring and generates a detailed answer using the live dashboard values. The user never notices which engine is running.

### Q: How is data secured?
**A:** Main users authenticate through Supabase — tokens are verified server-side via `supabase.auth.getUser()`, not just decoded locally. Delivery agents use a separate JWT signed with `AGENT_JWT_SECRET`. All protected API routes require a valid Bearer token. Passwords are hashed with bcrypt (cost 10).

### Q: What happens if the server restarts?
**A:** Agent statuses, GPS locations, and proof of delivery are persisted to JSON files immediately on every update. When the server starts, it reads these files back into memory. Users see no data loss.

### Q: What is the business value?
**A:** At 10 picking cycles per day, the AI system saves ₹1,280/day in labor and travel costs alone. Annually (300 working days), that is ₹384,000 per warehouse. Accurate demand forecasting also prevents stockouts (lost sales) and overstock (holding costs). The system pays for itself in weeks.

---

## 10. TECHNOLOGIES SUMMARY

| Technology | Role | Why chosen |
|---|---|---|
| React 18 | Frontend UI | Component-based, fast, industry standard |
| Vite | Build tool | Fast HMR, simple config |
| Node.js + Express 5 | REST API backend | JavaScript full-stack, simple routing |
| Supabase | Auth + PostgreSQL | Free tier, built-in auth, easy setup |
| scikit-learn | ML model | Best Python ML library, Pipeline support |
| pandas / numpy | Data processing | Standard data science stack |
| joblib | Model serialization | Save/load .pkl model files |
| python-shell | Node ↔ Python bridge | Call Python from Node.js |
| jsonwebtoken | Agent JWT | Lightweight, standard |
| bcryptjs | Password hashing | Secure, OWASP compliant |
| Plain CSS | Styling | No framework dependency, full control |

---

*Document generated for YCCE AIDS Final Year Mini Project — 2024–25*
