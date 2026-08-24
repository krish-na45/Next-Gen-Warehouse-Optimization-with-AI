"""
predict_pipeline.py
-------------------
Loads the saved pipeline_model.pkl and pipeline_meta.pkl,
accepts input as a JSON string (sys.argv[1]), and prints the prediction.

Usage (called from Node via python-shell):
  python ml/predict_pipeline.py '{"product_id":"P001", ...}'
"""

import sys
import json
import os
import warnings
import pandas as pd
import joblib

warnings.filterwarnings("ignore")

BASE_DIR   = os.path.join(os.path.dirname(__file__), "..")
MODEL_PATH = os.path.join(BASE_DIR, "models", "pipeline_model.pkl")
META_PATH  = os.path.join(BASE_DIR, "models", "pipeline_meta.pkl")

def predict(input_data: dict) -> float:
    pipeline = joblib.load(MODEL_PATH)
    meta     = joblib.load(META_PATH)

    drop_cols       = meta["drop_cols"]
    feature_columns = meta["feature_columns"]
    num_cols        = meta["num_cols"]
    cat_cols        = meta["cat_cols"]

    # Build a single-row DataFrame
    row = {col: [input_data.get(col, None)] for col in feature_columns}
    df  = pd.DataFrame(row)

    # Fill missing values
    for col in num_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)
    for col in cat_cols:
        if col in df.columns:
            df[col] = df[col].fillna("unknown").astype(str)

    # Ensure column order matches training
    df = df[feature_columns]

    pred = pipeline.predict(df)[0]
    return round(float(pred), 2)


if __name__ == "__main__":
    try:
        data   = json.loads(sys.argv[1])
        result = predict(data)
        print(json.dumps({"predicted_demand": result, "engine": "pipeline_rf"}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
