"""
Synthetic Warehouse Dataset Generator
Generates a realistic dataset for demand forecasting and warehouse optimization.
Columns: product_id, date, demand, inventory_level, warehouse_location,
         aisle_number, picking_time, order_id, reorder_point, lead_time_days,
         unit_price, category, day_of_week, month, is_weekend, rolling_avg_7d
"""

import pandas as pd
import numpy as np
import os

np.random.seed(42)

PRODUCTS = [f"P{str(i).zfill(3)}" for i in range(1, 51)]   # 50 products
LOCATIONS = ["Zone-A", "Zone-B", "Zone-C", "Zone-D", "Zone-E"]
CATEGORIES = ["Electronics", "Apparel", "Grocery", "Tools", "Furniture"]
DATES = pd.date_range(start="2023-01-01", end="2024-12-31", freq="D")

rows = []
order_counter = 1000

for product_id in PRODUCTS:
    category = np.random.choice(CATEGORIES)
    location = np.random.choice(LOCATIONS)
    aisle = np.random.randint(1, 21)
    unit_price = round(np.random.uniform(5.0, 500.0), 2)
    base_demand = np.random.randint(10, 100)
    inventory = np.random.randint(200, 1000)
    reorder_point = np.random.randint(50, 150)
    lead_time = np.random.randint(1, 10)

    for date in DATES:
        # Seasonal + trend + noise
        seasonal = 10 * np.sin(2 * np.pi * date.dayofyear / 365)
        trend = 0.01 * (date - DATES[0]).days
        noise = np.random.normal(0, 5)
        demand = max(0, int(base_demand + seasonal + trend + noise))

        # Weekend boost
        if date.dayofweek >= 5:
            demand = int(demand * 1.15)

        inventory = max(0, inventory - demand + np.random.randint(0, 30))
        picking_time = round(np.random.uniform(1.5, 15.0) + aisle * 0.3, 2)

        rows.append({
            "order_id": f"ORD{order_counter}",
            "product_id": product_id,
            "date": date.strftime("%Y-%m-%d"),
            "demand": demand,
            "inventory_level": inventory,
            "warehouse_location": location,
            "aisle_number": aisle,
            "picking_time": picking_time,
            "reorder_point": reorder_point,
            "lead_time_days": lead_time,
            "unit_price": unit_price,
            "category": category,
            "day_of_week": date.dayofweek,
            "month": date.month,
            "is_weekend": int(date.dayofweek >= 5),
        })
        order_counter += 1

df = pd.DataFrame(rows)

# Rolling 7-day average demand per product
df["date"] = pd.to_datetime(df["date"])
df = df.sort_values(["product_id", "date"])
df["rolling_avg_7d"] = (
    df.groupby("product_id")["demand"]
    .transform(lambda x: x.rolling(7, min_periods=1).mean())
    .round(2)
)
df["date"] = df["date"].dt.strftime("%Y-%m-%d")

os.makedirs("data", exist_ok=True)
df.to_csv("data/warehouse_data.csv", index=False)
print(f"Dataset generated: {len(df)} rows, {len(df.columns)} columns")
print(df.head(3).to_string())
