# ✅ VERIFICATION CHECKLIST — Warehouse AI

Use this checklist to confirm every feature is working correctly.

---

## 1. Environment Check

```bash
node --version        # Should be v18+
python --version      # Should be 3.8+
pip --version         # Should be present
```

- [ ] Node.js v18 or higher
- [ ] Python 3.8 or higher
- [ ] pip available
- [ ] `backend/node_modules/` exists (run `npm install`)
- [ ] `Mini-Project/node_modules/` exists (run `npm install`)
- [ ] `backend/models/pipeline_model.pkl` exists (run `python ml/ml_pipeline.py`)
- [ ] `backend/models/pipeline_meta.pkl` exists

---

## 2. Backend Startup

Start backend: `cd backend && npm run dev`

Expected console output:
```
✅  Pipeline model found — Python RF engine active.
✅  Warehouse AI backend running on http://localhost:5000
```

- [ ] No error messages on startup
- [ ] Shows "Pipeline model found" (Python RF active)
- [ ] Running on port 5000

### Health Check
Open browser or run:
```
GET http://localhost:5000/api/health
```
Expected:
```json
{ "status": "ok", "timestamp": "2026-..." }
```
- [ ] Health endpoint returns `{ "status": "ok" }`

---

## 3. Frontend Startup

Start frontend: `cd Mini-Project && npm run dev`

Expected output:
```
  VITE v7.x.x  ready
  ➜  Local:   http://localhost:5173/
```

- [ ] No build errors
- [ ] Running on port 5173
- [ ] Home page loads at `http://localhost:5173`

---

## 4. Authentication

### Register
1. Go to `http://localhost:5173/login`
2. Click **Register**
3. Enter: Name, Email, Password (min 6 chars)
4. Click Register

- [ ] Success message appears
- [ ] Confirmation email received in inbox
- [ ] Clicking email link confirms account

### Login
1. Enter registered email + password
2. Click Login

- [ ] Redirects to `/dashboard`
- [ ] No error messages
- [ ] `token` stored in localStorage (check DevTools → Application → Local Storage)

### Forgot Password
1. Click **Forgot Password?**
2. Enter email
3. Check inbox

- [ ] Reset email received
- [ ] Reset link opens `/reset-password`
- [ ] New password can be set

### Logout
1. On Dashboard, click **Logout**

- [ ] Redirects to `/login`
- [ ] `token` removed from localStorage

---

## 5. Dashboard — Demand Forecasting

1. Login and go to Dashboard
2. Leave default values or change them
3. Click **Predict Demand**

- [ ] Loading spinner shows
- [ ] Returns a number (e.g., `30 units`)
- [ ] Engine badge shows `🐍 Python Random Forest` (or JS fallback)
- [ ] No error message

Test with these values:
```
product_id: P001
warehouse_location: Zone-A
category: Electronics
aisle_number: 3
inventory_level: 250
reorder_point: 80
lead_time_days: 5
unit_price: 199.99
day_of_week: 2
month: 4
is_weekend: 0
```
Expected: ~30 units (pipeline_rf engine)

---

## 6. Dashboard — Route Optimisation

1. Enter aisles: `3,7,12,18,5`
2. Start aisle: `1`
3. Click **Optimise Route**

- [ ] Returns total distance in meters
- [ ] Returns estimated time in minutes
- [ ] Shows optimized aisle order as badges
- [ ] Engine badge shows `🐍 Python Dijkstra` or `⚡ JS Dijkstra`

---

## 7. Dashboard — AI Insights

1. Run Demand Prediction first
2. Run Route Optimisation first
3. Click **Get AI Insights**

- [ ] Returns a summary string
- [ ] Shows list of insights
- [ ] Shows list of suggestions
- [ ] Button is disabled until demand or route is run

---

## 8. Dataset Explorer

1. Go to `http://localhost:5173/data`
2. Click **Picking Data** card

- [ ] Table loads with data
- [ ] Shows row count and column count
- [ ] All 12 dataset cards visible
- [ ] Clicking different cards loads different data

---

## 9. Model Tester

1. Go to `http://localhost:5173/model-tester`
2. Upload `backend/data/warehouse_data.csv`
3. Click **Run Predictions**

- [ ] File accepted (shows filename + size)
- [ ] Loading state shows during prediction
- [ ] Results card appears
- [ ] Shows Total Rows: 36550
- [ ] Shows R² Score: ~0.97
- [ ] Shows MAE: ~2.89
- [ ] Shows RMSE: ~3.87
- [ ] Preview table shows 20 rows with predicted vs actual
- [ ] Error column highlighted red/green
- [ ] Download CSV button works

---

## 10. API Direct Tests (Optional)

### Register via API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"test123\"}"
```
Expected: `{ "message": "User registered successfully" }`

### Login via API
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"test123\"}"
```
Expected: `{ "token": "eyJ...", "username": "testuser" }`

### Predict Demand (use token from login)
```bash
curl -X POST http://localhost:5000/api/predict-demand \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d "{\"product_id\":\"P001\",\"category\":\"Electronics\",\"inventory_level\":250,\"reorder_point\":80,\"lead_time_days\":5,\"unit_price\":199.99,\"day_of_week\":2,\"month\":4,\"is_weekend\":0,\"aisle_number\":3,\"warehouse_location\":\"Zone-A\"}"
```
Expected: `{ "predicted_demand": 30.16, "engine": "pipeline_rf" }`

---

## 11. Python Model Direct Test

```bash
cd backend
node test_model.js
```

Expected:
```
Testing pipeline model via python-shell...
✅ Prediction result: { predicted_demand: 30.16, engine: 'pipeline_rf' }
```

- [ ] Returns prediction without errors
- [ ] Engine is `pipeline_rf`

---

## Final Sign-off

| Feature | Status |
|---------|--------|
| Backend starts | ☐ |
| Frontend starts | ☐ |
| Register works | ☐ |
| Login works | ☐ |
| Logout works | ☐ |
| Demand prediction (Python RF) | ☐ |
| Route optimization | ☐ |
| AI Insights | ☐ |
| Dataset Explorer | ☐ |
| Model Tester upload | ☐ |
| Metrics displayed correctly | ☐ |
| CSV download works | ☐ |

All 12 checked = project fully verified ✅
