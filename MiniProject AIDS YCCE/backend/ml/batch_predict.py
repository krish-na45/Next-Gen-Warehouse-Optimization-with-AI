"""
batch_predict.py
----------------
Accepts a CSV/Excel file path as sys.argv[1].
Loads the saved pipeline, runs predictions on all rows,
and prints a JSON result to stdout.
"""

import sys
import json
import os
import warnings
import pandas as pd
import numpy as np
import joblib

warnings.filterwarnings("ignore")

BASE_DIR   = os.path.join(os.path.dirname(__file__), "..")
MODEL_PATH = os.path.join(BASE_DIR, "models", "pipeline_model.pkl")
META_PATH  = os.path.join(BASE_DIR, "models", "pipeline_meta.pkl")


def run(filepath: str) -> dict:
    # ── Load model + meta ──────────────────────────────────────────────────
    pipeline        = joblib.load(MODEL_PATH)
    meta            = joblib.load(META_PATH)
    feature_columns = meta["feature_columns"]
    num_cols        = meta["num_cols"]
    cat_cols        = meta["cat_cols"]
    drop_cols       = meta["drop_cols"]
    target          = meta["target"]

    # ── Load file ──────────────────────────────────────────────────────────
    ext = os.path.splitext(filepath)[1].lower()
    df  = pd.read_excel(filepath) if ext in (".xlsx", ".xls") else pd.read_csv(filepath)

    total_rows = len(df)

    # ── Check if actual labels exist ───────────────────────────────────────
    has_labels = target in df.columns
    y_actual   = df[target].tolist() if has_labels else None

    # ── Drop leakage / target columns ─────────────────────────────────────
    cols_to_drop = [c for c in drop_cols + [target] if c in df.columns]
    df = df.drop(columns=cols_to_drop)

    # ── Fill missing values ────────────────────────────────────────────────
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    for col in cat_cols:
        if col in df.columns:
            df[col] = df[col].fillna("unknown").astype(str)

    # ── Align columns to training features ────────────────────────────────
    missing_cols = [c for c in feature_columns if c not in df.columns]
    extra_cols   = [c for c in df.columns if c not in feature_columns]

    # If more than half the required columns are missing, reject early
    if len(missing_cols) > len(feature_columns) // 2:
        return {
            "error": (
                f"Dataset columns don't match the model. "
                f"Missing {len(missing_cols)} required columns: {missing_cols[:5]}{'...' if len(missing_cols) > 5 else ''}. "
                f"Required columns: {feature_columns}"
            )
        }

    # Fill missing columns with 0
    for col in missing_cols:
        df[col] = 0

    df = df[feature_columns]

    # ── Predict ────────────────────────────────────────────────────────────
    preds = pipeline.predict(df)
    preds_rounded = [round(float(p), 2) for p in preds]

    # ── Metrics if labels present ──────────────────────────────────────────
    metrics = None
    if has_labels:
        from sklearn.metrics import r2_score, mean_absolute_error, mean_squared_error
        y = np.array(y_actual, dtype=float)
        p = np.array(preds, dtype=float)
        metrics = {
            "r2":   round(float(r2_score(y, p)), 4),
            "mae":  round(float(mean_absolute_error(y, p)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y, p))), 4),
        }

    # ── Build preview (first 20 rows) ──────────────────────────────────────
    preview = []
    for i in range(min(20, total_rows)):
        row = {"row": i + 1, "predicted_demand": preds_rounded[i]}
        if has_labels:
            row["actual_demand"] = round(float(y_actual[i]), 2)
            row["error"]         = round(abs(float(y_actual[i]) - preds_rounded[i]), 2)
        preview.append(row)

    return {
        "total_rows":   total_rows,
        "has_labels":   has_labels,
        "metrics":      metrics,
        "preview":      preview,
        "all_predictions": preds_rounded,
        "engine":       "pipeline_rf",
    }


if __name__ == "__main__":
    try:
        result = run(sys.argv[1])
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
