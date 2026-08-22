"""
Supply Chain Dataset Preprocessing Pipeline
Loads, cleans, and feature-engineers all generated datasets.
Outputs a unified ML-ready dataset.
"""

import pandas as pd
import numpy as np
import os

DATA_DIR = "data"
OUT_PATH = os.path.join(DATA_DIR, "ml_ready_dataset.csv")


def load_all():
    print("Loading datasets...")
    orders   = pd.read_csv(f"{DATA_DIR}/OrderList.csv")
    freight  = pd.read_csv(f"{DATA_DIR}/FreightRates.csv")
    wh_costs = pd.read_csv(f"{DATA_DIR}/WhCosts.csv")
    wh_caps  = pd.read_csv(f"{DATA_DIR}/WhCapacities.csv")
    picking  = pd.read_csv(f"{DATA_DIR}/WarehousePickingData.csv")
    layout   = pd.read_csv(f"{DATA_DIR}/WarehouseLayout.csv")
    routes   = pd.read_csv(f"{DATA_DIR}/PickingRoutes.csv")
    carrier  = pd.read_csv(f"{DATA_DIR}/CarrierPerformance.csv")
    return orders, freight, wh_costs, wh_caps, picking, layout, routes, carrier


def clean_orders(df):
    df = df.copy()
    df["Order_Date"] = pd.to_datetime(df["Order_Date"])
    df["day_of_week"] = df["Order_Date"].dt.dayofweek
    df["month"]       = df["Order_Date"].dt.month
    df["quarter"]     = df["Order_Date"].dt.quarter
    df["is_weekend"]  = (df["Order_Date"].dt.dayofweek >= 5).astype(int)
    df["year"]        = df["Order_Date"].dt.year
    # Fill missing
    df["Weight_KG"].fillna(df["Weight_KG"].median(), inplace=True)
    df["Unit_Quantity"].fillna(df["Unit_Quantity"].median(), inplace=True)
    df["Ship_Late_Days"].fillna(0, inplace=True)
    df["Ship_Ahead_Days"].fillna(0, inplace=True)
    return df


def enrich_picking(picking, wh_costs, wh_caps, layout):
    """Merge warehouse metadata into picking data."""
    picking = picking.copy()
    picking["date"] = pd.to_datetime(picking["date"])

    # Merge WH cost
    picking = picking.merge(
        wh_costs.rename(columns={"WH": "plant_code"}),
        on="plant_code", how="left"
    )
    # Merge WH capacity
    picking = picking.merge(
        wh_caps[["Plant_ID", "Daily_Capacity", "Num_Aisles", "Sq_Footage"]]
        .rename(columns={"Plant_ID": "plant_code"}),
        on="plant_code", how="left"
    )
    # Merge aisle layout info
    aisle_avg = layout.groupby(["plant_code", "aisle_number"]).agg(
        aisle_length_m=("aisle_length_m", "mean"),
        distance_from_dock_m=("distance_from_dock_m", "mean"),
        pick_frequency=("pick_frequency", "first")
    ).reset_index()
    picking = picking.merge(aisle_avg, on=["plant_code", "aisle_number"], how="left")

    # Encode pick_frequency
    freq_map = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    picking["pick_freq_enc"] = picking["pick_frequency"].map(freq_map).fillna(2)

    # Fill remaining nulls
    for col in picking.select_dtypes(include=[np.number]).columns:
        picking[col] = picking[col].fillna(picking[col].median())

    # Utilization ratio
    picking["inventory_utilization"] = (
        picking["inventory_level"] / picking["Daily_Capacity"].replace(0, 1)
    ).round(4)

    # Demand velocity (demand / lead_time)
    picking["demand_velocity"] = (
        picking["demand"] / picking["lead_time_days"].replace(0, 1)
    ).round(4)

    return picking


def encode_categoricals(df):
    from sklearn.preprocessing import LabelEncoder
    import pickle

    encoders = {}
    cat_cols = ["product_id", "plant_code", "warehouse_location",
                "category", "service_level", "carrier"]
    for col in cat_cols:
        if col in df.columns:
            le = LabelEncoder()
            df[col + "_enc"] = le.fit_transform(df[col].astype(str))
            encoders[col] = le

    os.makedirs("models", exist_ok=True)
    with open("models/supply_chain_encoders.pkl", "wb") as f:
        import pickle
        pickle.dump(encoders, f)
    print(f"  Saved {len(encoders)} label encoders.")
    return df, encoders


def main():
    orders, freight, wh_costs, wh_caps, picking, layout, routes, carrier = load_all()

    print("Cleaning orders...")
    orders = clean_orders(orders)

    print("Enriching picking data...")
    picking = enrich_picking(picking, wh_costs, wh_caps, layout)

    print("Encoding categoricals...")
    picking, _ = encode_categoricals(picking)

    # Final feature set for ML
    feature_cols = [
        "product_id_enc", "plant_code_enc", "warehouse_location_enc",
        "category_enc", "service_level_enc", "carrier_enc",
        "aisle_number", "inventory_level", "reorder_point",
        "lead_time_days", "unit_price", "day_of_week", "month",
        "quarter", "is_weekend", "week_of_year",
        "rolling_avg_7d", "rolling_avg_30d",
        "demand_lag_1", "demand_lag_7", "demand_lag_30",
        "stockout_risk", "freight_cost_usd",
        "Cost_per_unit", "Daily_Capacity", "Num_Aisles",
        "aisle_length_m", "distance_from_dock_m", "pick_freq_enc",
        "inventory_utilization", "demand_velocity",
        "demand"  # target
    ]
    available = [c for c in feature_cols if c in picking.columns]
    ml_df = picking[available].dropna()

    ml_df.to_csv(OUT_PATH, index=False)
    print(f"\nML-ready dataset: {len(ml_df):,} rows × {len(ml_df.columns)} columns")
    print(f"Saved to {OUT_PATH}")

    # Quick stats
    print("\nFeature summary:")
    print(ml_df.describe().round(2).to_string())


if __name__ == "__main__":
    main()
