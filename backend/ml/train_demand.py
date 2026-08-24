"""
Demand Forecasting Model
- Random Forest for tabular features
- Saves model as demand_model.pkl
- Evaluates with RMSE and R2
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder

DATA_PATH = "data/warehouse_data.csv"
MODEL_PATH = "models/demand_model.pkl"
ENCODER_PATH = "models/label_encoders.pkl"

def load_and_preprocess(path):
    df = pd.read_csv(path)
    df["date"] = pd.to_datetime(df["date"])

    # Encode categoricals
    encoders = {}
    for col in ["product_id", "warehouse_location", "category"]:
        le = LabelEncoder()
        df[col + "_enc"] = le.fit_transform(df[col])
        encoders[col] = le

    features = [
        "product_id_enc", "warehouse_location_enc", "category_enc",
        "aisle_number", "inventory_level", "reorder_point",
        "lead_time_days", "unit_price", "day_of_week", "month",
        "is_weekend", "rolling_avg_7d"
    ]
    X = df[features]
    y = df["demand"]
    return X, y, encoders

def train():
    os.makedirs("models", exist_ok=True)
    print("Loading data...")
    X, y, encoders = load_and_preprocess(DATA_PATH)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    print("Training Random Forest...")
    model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    rmse = np.sqrt(mean_squared_error(y_test, y_pred))
    r2 = r2_score(y_test, y_pred)
    print(f"RMSE: {rmse:.4f}  |  R2: {r2:.4f}")

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(encoders, f)

    print(f"Model saved to {MODEL_PATH}")
    return {"rmse": round(rmse, 4), "r2": round(r2, 4)}

def predict(input_data: dict):
    """
    input_data keys: product_id, warehouse_location, category, aisle_number,
    inventory_level, reorder_point, lead_time_days, unit_price,
    day_of_week, month, is_weekend, rolling_avg_7d
    """
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(ENCODER_PATH, "rb") as f:
        encoders = pickle.load(f)

    row = {}
    for col in ["product_id", "warehouse_location", "category"]:
        le = encoders[col]
        val = input_data.get(col, le.classes_[0])
        if val not in le.classes_:
            val = le.classes_[0]
        row[col + "_enc"] = le.transform([val])[0]

    for col in ["aisle_number", "inventory_level", "reorder_point",
                "lead_time_days", "unit_price", "day_of_week",
                "month", "is_weekend", "rolling_avg_7d"]:
        row[col] = float(input_data.get(col, 0))

    features = [
        "product_id_enc", "warehouse_location_enc", "category_enc",
        "aisle_number", "inventory_level", "reorder_point",
        "lead_time_days", "unit_price", "day_of_week", "month",
        "is_weekend", "rolling_avg_7d"
    ]
    X = pd.DataFrame([row])[features]
    pred = model.predict(X)[0]
    return round(float(pred), 2)

if __name__ == "__main__":
    metrics = train()
    print("Metrics:", metrics)
