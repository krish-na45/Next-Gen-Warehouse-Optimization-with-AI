# 🛠️ SETUP GUIDE — Warehouse AI

Complete technical setup guide with explanations.

---

## Project Structure

```
MiniProject AIDS YCCE/
├── backend/                    ← Node.js + Express API
│   ├── data/                   ← 12 CSV datasets
│   ├── middleware/
│   │   └── auth.js             ← JWT validation middleware
│   ├── ml/
│   │   ├── ml_pipeline.py      ← Train & evaluate model
│   │   ├── predict_pipeline.py ← Single prediction (called by Node)
│   │   ├── batch_predict.py    ← Batch prediction from file
│   │   ├── optimize_route.py   ← Python Dijkstra
│   │   ├── train_demand.py     ← Original demand trainer
│   │   └── preprocess.py       ← Data preprocessing
│   ├── models/
│   │   ├── pipeline_model.pkl  ← Trained RandomForest pipeline
│   │   ├── pipeline_meta.pkl   ← Feature column metadata
│   │   ├── demand_model.pkl    ← Original demand model
│   │   └── label_encoders.pkl  ← Label encoders
│   ├── routes/
│   │   ├── auth.js             ← Register / Login
│   │   ├── demand.js           ← Demand prediction
│   │   ├── route.js            ← Route optimization
│   │   ├── insights.js         ← AI insights
│   │   ├── data.js             ← Dataset browser
│   │   └── upload.js           ← File upload + batch predict
│   ├── uploads/                ← Temp uploaded files (auto-cleaned)
│   ├── server.js               ← Express entry point
│   ├── .env                    ← Environment variables
│   ├── package.json
│   └── requirements.txt
│
├── Mini-Project/               ← React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── Footer.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx       ← Supabase auth
│   │   │   ├── Dashboard.jsx   ← Main AI dashboard
│   │   │   ├── DataExplorer.jsx
│   │   │   ├── ModelTester.jsx ← Upload & batch predict
│   │   │   ├── Features.jsx
│   │   │   ├── SystemModules.jsx
│   │   │   ├── Contact.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ResetPassword.jsx
│   │   ├── supabase.js         ← Supabase client
│   │   ├── supabaseAuth.js     ← Auth functions
│   │   ├── App.jsx             ← Routes
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── README.md
├── QUICK_REFERENCE.md
├── QUICK_START.md
├── SETUP_GUIDE.md              ← This file
├── SUPABASE_SETUP.md
├── VERIFICATION_CHECKLIST.md
└── CHANGES_SUMMARY.md
```

---

## Backend Setup (Detailed)

### 1. Install Node dependencies

```bash
cd backend
npm install
```

Packages installed:
| Package | Version | Purpose |
|---------|---------|---------|
| express | ^5.2.1 | Web framework |
| cors | ^2.8.6 | Cross-origin requests |
| dotenv | ^17.3.1 | Environment variables |
| bcryptjs | ^3.0.3 | Password hashing |
| jsonwebtoken | ^9.0.3 | JWT tokens |
| python-shell | ^5.0.0 | Run Python from Node |
| multer | ^2.1.1 | File upload handling |

### 2. Configure environment

`backend/.env`:
```env
PORT=5000
JWT_SECRET=warehouse_ai_secret_key_change_in_production
JWT_EXPIRES_IN=24h

# Optional: override Python path (useful for conda/venv)
# PYTHON_PATH=C:\Users\YourName\anaconda3\python.exe
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

`requirements.txt`:
```
pandas>=2.0.0
numpy>=1.24.0
scikit-learn>=1.3.0
```

Also needs `joblib` (installed with scikit-learn automatically).

### 4. Train the ML model

```bash
python ml/ml_pipeline.py
```

This script:
- Loads `data/warehouse_data.csv` (36,550 rows)
- Auto-detects regression problem (target: `demand`)
- Encodes categoricals with OneHotEncoder
- Scales numerics with StandardScaler
- Trains RandomForestRegressor (100 trees)
- Runs GridSearchCV for tuning
- Evaluates: R² ~0.97, MAE ~2.89, RMSE ~3.87
- Saves `models/pipeline_model.pkl` and `models/pipeline_meta.pkl`

### 5. Start the backend

```bash
npm run dev
```

Server starts on `http://localhost:5000`

---

## Frontend Setup (Detailed)

### 1. Install dependencies

```bash
cd Mini-Project
npm install
```

Packages:
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI framework |
| react-dom | ^18.3.1 | DOM rendering |
| react-router-dom | ^6.28.0 | Client-side routing |
| @supabase/supabase-js | ^2.38.0 | Auth & database |
| vite | ^7.3.1 | Build tool |

### 2. Supabase configuration

`src/supabase.js` contains the Supabase project URL and anon key.
These are already configured for the project's Supabase instance.

```
URL: https://lhgbcylukzflobaipegm.supabase.co
```

### 3. Start the frontend

```bash
npm run dev
```

Frontend starts on `http://localhost:5173`

---

## Authentication Flow

```
User submits login form
        ↓
supabaseAuth.login(email, password)
        ↓
Supabase verifies credentials
        ↓
Returns session with access_token
        ↓
localStorage.setItem('token', access_token)
        ↓
Navigate to /dashboard
        ↓
Dashboard reads token from localStorage
        ↓
Sends: Authorization: Bearer <token>
        ↓
backend/middleware/auth.js validates token
        ↓
Request proceeds to route handler
```

---

## ML Prediction Flow

```
User fills Dashboard form
        ↓
POST /api/predict-demand  { product_id, category, ... }
        ↓
auth middleware validates token
        ↓
routes/demand.js receives request
        ↓
Spawns: python ml/predict_pipeline.py '<json>'
        ↓
predict_pipeline.py loads pipeline_model.pkl
        ↓
Aligns input columns to training features
        ↓
RandomForest.predict(X)
        ↓
Returns: { predicted_demand: 30.16, engine: "pipeline_rf" }
        ↓
Dashboard displays result
```

If Python fails at any step → JS rule-based engine runs as fallback.

---

## Route Optimization Flow

```
User enters aisles: [3, 7, 12, 18, 5], start: 1
        ↓
POST /api/optimize-route
        ↓
Builds warehouse graph (20 nodes, weighted edges)
        ↓
Greedy nearest-neighbor + Dijkstra between stops
        ↓
Returns optimized order, total distance, estimated time
```

---

## Batch Prediction Flow (Model Tester)

```
User uploads CSV/Excel file
        ↓
POST /api/upload/predict  (multipart/form-data)
        ↓
multer saves file to backend/uploads/
        ↓
Spawns: python ml/batch_predict.py <filepath>
        ↓
batch_predict.py loads file, aligns columns
        ↓
Predicts all rows
        ↓
If 'demand' column present → calculates R², MAE, RMSE
        ↓
Returns preview (20 rows) + all predictions + metrics
        ↓
Uploaded file deleted from server
        ↓
Frontend displays results table + download button
```

---

## Troubleshooting

### Backend won't start
```bash
# Check Node version
node --version   # needs v18+

# Check port conflict
netstat -ano | findstr :5000
# Kill the process using port 5000 if needed
```

### Python model not loading
```bash
# Verify Python path
python --version

# Verify packages
python -c "import joblib, pandas, sklearn; print('ok')"

# Retrain model
python ml/ml_pipeline.py

# Test prediction directly
node test_model.js
```

### Frontend can't reach backend
- Confirm backend is running on port 5000
- Check browser console for CORS errors
- Verify `const API = 'http://localhost:5000/api'` in Dashboard.jsx

### Token errors (401/403)
- Log out and log back in to refresh the Supabase token
- Supabase tokens expire — re-login generates a new one

### Upload returns HTML instead of JSON
- Backend was not restarted after adding the upload route
- Restart: `Ctrl+C` then `npm run dev` in backend terminal
