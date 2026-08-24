"""
Dataset Preprocessing Pipeline
- Loads raw CSV (user-provided or generated)
- Handles missing values
- Engineers features
- Outputs cleaned CSV ready for model training
"""

import pandas as pd
import numpy as np
import os

def preprocess(input_path: str, output_path: str = "data/cleaned_warehouse_data.csv"):
    print(f"Loading: {input_path}")
    df = pd.read_csv(input_path)

    print(f"Raw shape: {df.shape}")
    print(f"Missing values:\n{df.isnull().sum()[df.isnull().sum() > 0]}")

    # --- Missing value handling ---
    # Numeric: fill with median per product group
    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    for col in numeric_cols:
        if df[col].isnull().any():
            df[col] = df.groupby("product_id")[col].transform(
                lambda x: x.fillna(x.median())
            )
            df[col] = df[col].fillna(df[col].median())  # fallback

    # Categorical: fill with mode
    cat_cols = df.select_dtypes(include=["object"]).columns.tolist()
    for col in cat_cols:
        if col != "date" and df[col].isnull().any():
            df[col] = df[col].fillna(df[col].mode()[0])

    # --- Feature engineering ---
    df["date"] = pd.to_datetime(df["date"])
    df["day_of_week"] = df["date"].dt.dayofweek
    df["month"] = df["date"].dt.month
    df["quarter"] = df["date"].dt.quarter
    df["is_weekend"] = (df["date"].dt.dayofweek >= 5).astype(int)
    df["week_of_year"] = df["date"].dt.isocalendar().week.astype(int)

    # Rolling features per product
    df = df.sort_values(["product_id", "date"])
    df["rolling_avg_7d"] = (
        df.groupby("product_id")["demand"]
        .transform(lambda x: x.rolling(7, min_periods=1).mean())
        .round(2)
    )
    df["rolling_avg_30d"] = (
        df.groupby("product_id")["demand"]
        .transform(lambda x: x.rolling(30, min_periods=1).mean())
        .round(2)
    )
    df["demand_lag_1"] = df.groupby("product_id")["demand"].shift(1).fillna(0)
    df["demand_lag_7"] = df.groupby("product_id")["demand"].shift(7).fillna(0)

    # Stockout flag
    df["stockout_risk"] = (df["inventory_level"] <= df["reorder_point"]).astype(int)

    df["date"] = df["date"].dt.strftime("%Y-%m-%d")

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)
    print(f"Cleaned dataset saved: {output_path}  shape={df.shape}")
    return df

if __name__ == "__main__":
    preprocess("data/warehouse_data.csv")
