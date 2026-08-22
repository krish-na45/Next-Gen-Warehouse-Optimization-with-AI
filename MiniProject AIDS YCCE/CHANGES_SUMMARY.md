# 📝 CHANGES SUMMARY — Warehouse AI

Complete log of all features built and changes made to the project.

---

## Original Project (Base)

The project started with:
- React + Vite frontend with basic pages
- Express.js backend with auth routes
- Supabase authentication (login, register)
- JWT middleware for API protection
- Basic Dashboard UI (no working ML)
- Placeholder demand/route routes with JS rule engines only

---

## Changes Made

---

### 1. ML Pipeline — Full Supervised Learning System

**File created:** `backend/ml/ml_pipeline.py`

A complete, reusable supervised learning pipeline:
- Loads any CSV or Excel dataset
- Auto-detects classification vs regression based on target column
- Handles missing values (median for numeric, mode for categorical)
- Encodes categoricals with OneHotEncoder
- Scales numerics with StandardScaler
- Trains RandomForestRegressor (target: `demand`, 36,550 rows)
- Runs GridSearchCV for hyperparameter tuning
- Evaluates: R² ~0.97, MAE ~2.89, RMSE ~3.87
- Saves model and metadata with joblib

**Why RandomForest:** Handles mixed feature types, non-linear relationships, robust to outliers, provides feature importances.

---

### 2. Prediction Script — Node ↔ Python Bridge

**File created:** `backend/ml/predict_pipeline.py`

Standalone Python script called by Node.js via python-shell:
- Accepts JSON input as command-line argument
- Loads `pipeline_model.pkl` and `pipeline_meta.pkl`
- Aligns input columns to training features automatically
- Fills missing columns with 0 (handles partial inputs)
- Returns JSON: `{ "predicted_demand": 30.16, "engine": "pipeline_rf" }`

---

### 3. Batch Prediction Script

**File created:** `backend/ml/batch_predict.py`

Processes entire CSV/Excel files:
- Loads file (CSV or Excel auto-detected)
- Drops leakage columns and aligns features
- Predicts all rows in one pass
- If `demand` column present: calculates R², MAE, RMSE
- Returns preview (20 rows), all predictions, metrics
- Validates column match — rejects files with too many missing columns

---

### 4. Demand Route — Python RF Integration

**File modified:** `backend/routes/demand.js`

Updated prediction priority chain:
```
Before: JS rule-based engine only
After:  Python RF pipeline → JS fallback
```

Key changes:
- Checks for `pipeline_model.pkl` and `pipeline_meta.pkl` on startup
- Uses instance-based `PythonShell` (not static `.run()`) — required for Windows + conda
- Explicit Python path resolution (`PYTHON_PATH` env var or conda default)
- Graceful fallback to JS rule engine if Python fails
- Logs engine used in response: `pipeline_rf`, `js_rule_based`, `js_fallback`

---

### 5. Upload Route — File Upload + Batch Predict

**File created:** `backend/routes/upload.js`

New API endpoint: `POST /api/upload/predict`
- Accepts CSV and Excel files (max 10 MB) via multipart/form-data
- Uses multer for file handling
- Saves to `backend/uploads/` temporarily
- Spawns `batch_predict.py` with file path
- Deletes uploaded file after prediction (no storage accumulation)
- Returns full results JSON to frontend

---

### 6. Server — Upload Route Registered

**File modified:** `backend/server.js`

Added:
```js
const uploadRoutes = require("./routes/upload");
app.use("/api/upload", authMiddleware, uploadRoutes);
```

---

### 7. Model Tester Page — Frontend

**File created:** `Mini-Project/src/pages/ModelTester.jsx`

New page at `/model-tester`:
- Drag & drop or click-to-browse file upload
- Accepts CSV and Excel files
- Shows file name and size after selection
- Calls `POST /api/upload/predict` with Bearer token
- Displays results:
  - Total rows processed
  - Engine used
  - R², MAE, RMSE (if labels present)
  - Preview table (20 rows) with predicted vs actual + error
  - Error cells highlighted red (>20) or green (≤20)
  - "Show all" toggle for full predictions
  - Download predictions as CSV button
- Smart error handling: detects HTML responses (server down/404) and shows clear messages
- Column mismatch error shows helpful hint about required columns

**File created:** `Mini-Project/src/pages/ModelTester.css`

Styled to match the app's light theme:
- Deep blue gradient hero (heading clearly visible)
- White panel cards with subtle shadows
- Light drop zone with blue dashed border
- Stat boxes with gradient backgrounds
- Clean table with uppercase headers
- Responsive layout for mobile

---

### 8. App Router — New Route Added

**File modified:** `Mini-Project/src/App.jsx`

Added:
```jsx
import ModelTester from './pages/ModelTester.jsx'
<Route path="/model-tester" element={<ModelTester />} />
```

---

### 9. Navbar — Model Tester Link Added

**File modified:** `Mini-Project/src/components/Navbar.jsx`

Added `{ path: '/model-tester', label: 'Model Tester' }` to nav links.

---

### 10. Integration Test

**File created:** `backend/test_model.js`

Quick Node.js test to verify python-shell ↔ Python communication:
```bash
node test_model.js
# ✅ Prediction result: { predicted_demand: 30.16, engine: 'pipeline_rf' }
```

---

### 11. python-shell Installed

**File modified:** `backend/package.json`

Added dependency:
```json
"python-shell": "^5.0.0"
```

Also installed: `multer ^2.1.1` for file uploads.

---

## Model Performance Summary

| Metric | Value |
|--------|-------|
| Algorithm | RandomForestRegressor |
| Training rows | 29,240 (80%) |
| Test rows | 7,310 (20%) |
| R² Score | ~0.9784 |
| MAE | ~2.89 units |
| RMSE | ~3.87 units |
| Tuning | GridSearchCV (n_estimators, max_depth) |
| Features | 8 numeric + 3 categorical (OneHot encoded) |
| Target | `demand` (continuous, regression) |

---

## File Change Log

| File | Change Type | Description |
|------|-------------|-------------|
| `backend/ml/ml_pipeline.py` | Created | Full training pipeline |
| `backend/ml/predict_pipeline.py` | Created | Single prediction script |
| `backend/ml/batch_predict.py` | Created | Batch prediction script |
| `backend/routes/demand.js` | Modified | Python RF integration |
| `backend/routes/upload.js` | Created | File upload + batch predict |
| `backend/server.js` | Modified | Register upload route |
| `backend/package.json` | Modified | Added python-shell, multer |
| `backend/test_model.js` | Created | Integration test |
| `Mini-Project/src/pages/ModelTester.jsx` | Created | Upload & test UI |
| `Mini-Project/src/pages/ModelTester.css` | Created | Page styling |
| `Mini-Project/src/App.jsx` | Modified | Added /model-tester route |
| `Mini-Project/src/components/Navbar.jsx` | Modified | Added Model Tester link |
| `QUICK_REFERENCE.md` | Created | Quick lookup card |
| `QUICK_START.md` | Created | Setup checklist |
| `SETUP_GUIDE.md` | Created | Detailed setup guide |
| `SUPABASE_SETUP.md` | Created | Supabase configuration |
| `VERIFICATION_CHECKLIST.md` | Created | Test suite |
| `CHANGES_SUMMARY.md` | Created | This file |

---

## Architecture Overview (Final State)

```
Browser
  └── React + Vite (localhost:5173)
        ├── Supabase Auth → JWT token in localStorage
        ├── Dashboard → POST /api/predict-demand
        │                POST /api/optimize-route
        │                POST /api/get-insights
        ├── Model Tester → POST /api/upload/predict
        └── Data Explorer → GET /api/data/:dataset

Express API (localhost:5000)
  └── auth middleware (validates Supabase JWT)
        ├── /api/predict-demand
        │     └── python predict_pipeline.py
        │           └── pipeline_model.pkl (RandomForest)
        │     fallback: JS rule engine
        ├── /api/optimize-route
        │     └── python optimize_route.py (Dijkstra)
        │     fallback: JS Dijkstra
        ├── /api/get-insights → rule-based engine
        ├── /api/upload/predict
        │     └── multer → python batch_predict.py
        │           └── pipeline_model.pkl (batch)
        └── /api/data/:dataset → CSV reader
```
