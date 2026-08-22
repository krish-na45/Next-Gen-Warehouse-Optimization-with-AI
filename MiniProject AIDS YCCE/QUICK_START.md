# 🚀 QUICK START — Warehouse AI

Complete setup in under 10 minutes.

---

## Prerequisites Checklist

Before starting, make sure you have:

- [ ] Node.js v18 or higher → `node --version`
- [ ] Python 3.8 or higher → `python --version`
- [ ] pip → `pip --version`
- [ ] Git (optional)

---

## Step 1 — Install Backend Dependencies

```bash
cd "MiniProject AIDS YCCE/backend"
npm install
```

Expected output: `added XX packages`

---

## Step 2 — Install Frontend Dependencies

```bash
cd "MiniProject AIDS YCCE/Mini-Project"
npm install
```

Expected output: `added XX packages`

---

## Step 3 — Install Python Dependencies

```bash
cd "MiniProject AIDS YCCE/backend"
pip install -r requirements.txt
```

Installs: `pandas`, `numpy`, `scikit-learn`

---

## Step 4 — Train the ML Model (first time only)

```bash
cd "MiniProject AIDS YCCE/backend"
python ml/ml_pipeline.py
```

Expected output:
```
✅  Loaded: data/warehouse_data.csv
    Shape  : 36550 rows × 16 columns
── Problem type : REGRESSION
Training Random Forest...
RMSE: X.XXXX  |  R2: 0.97XX
✅  Model saved → models/pipeline_model.pkl
```

> Skip this step if `models/pipeline_model.pkl` already exists.

---

## Step 5 — Start the Backend

Open **Terminal 1**:

```bash
cd "MiniProject AIDS YCCE/backend"
npm run dev
```

Expected output:
```
✅  Pipeline model found — Python RF engine active.
✅  Warehouse AI backend running on http://localhost:5000
```

---

## Step 6 — Start the Frontend

Open **Terminal 2**:

```bash
cd "MiniProject AIDS YCCE/Mini-Project"
npm run dev
```

Expected output:
```
  VITE v7.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

---

## Step 7 — Open the App

Go to: **http://localhost:5173**

1. Click **Register** → create an account
2. Confirm your email (check inbox)
3. Click **Login** → enter credentials
4. You'll land on the **Dashboard**

---

## Step 8 — Test the Features

### Demand Prediction
- Go to Dashboard
- Fill in the form (defaults are pre-filled)
- Click **Predict Demand**
- Should show predicted units + `🐍 Python Random Forest` badge

### Route Optimization
- Enter aisles: `3,7,12,18,5`
- Start aisle: `1`
- Click **Optimise Route**
- Shows distance, time, and optimized order

### AI Insights
- After running demand + route
- Click **Get AI Insights**
- Shows inventory analysis and suggestions

### Model Tester
- Go to `/model-tester`
- Upload `backend/data/warehouse_data.csv`
- Click **Run Predictions**
- Shows R² ~0.97, MAE, RMSE, preview table

### Dataset Explorer
- Go to `/data`
- Click any dataset card
- Browse the CSV data in a table

---

## Verify Everything Works

```
✅ Backend running on :5000
✅ Frontend running on :5173
✅ Can register a new account
✅ Can login
✅ Dashboard loads
✅ Predict Demand returns a number
✅ Optimise Route returns a path
✅ Model Tester accepts CSV upload
✅ Dataset Explorer shows data
```

All 9 checked? You're fully set up.

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `Cannot reach backend` | Make sure `npm run dev` is running in `backend/` |
| `engine: js_rule_based` instead of `pipeline_rf` | Run `python ml/ml_pipeline.py` to train the model |
| Login redirects but Dashboard shows nothing | Check browser console for token errors |
| Upload returns HTML error | Restart the backend after any route changes |
| Python not found | Set `PYTHON_PATH` in `backend/.env` |
