"""
Comprehensive Supply Chain & Warehouse Dataset Generator
Mirrors the structure of the uploaded dataset with:
- OrderList (orders with carriers, ports, products)
- FreightRates (carrier rate tables)
- WhCosts (warehouse costs per unit)
- WhCapacities (daily warehouse capacities)
- ProductsPerPlant (product-plant mapping)
- PlantPorts (plant-port mapping)
- VmiCustomers (VMI customer mapping)
- warehouse_picking (aisle-level picking data for ML)
"""

import pandas as pd
import numpy as np
import os
import random
from datetime import datetime, timedelta

np.random.seed(42)
random.seed(42)

os.makedirs("data", exist_ok=True)

# ─────────────────────────────────────────────
# MASTER REFERENCE DATA
# ─────────────────────────────────────────────

PLANTS = [f"PLANT{str(i).zfill(2)}" for i in range(1, 21)]
PORTS  = [f"PORT{str(i).zfill(2)}" for i in range(1, 13)]
CARRIERS = [f"V{str(i).zfill(3)}_CARRIER" for i in range(1, 16)]
CUSTOMERS = [f"CUST_{str(i).zfill(4)}" for i in range(1, 201)]
PRODUCTS  = [f"PROD_{str(i).zfill(6)}" for i in range(1700000, 1702001)]
SERVICE_LEVELS = ["CRF", "DTP", "DTD", "EXW"]
MODES = ["AIR", "GROUND", "SEA"]
CATEGORIES = ["Electronics", "Apparel", "Grocery", "Tools", "Furniture",
               "Pharmaceuticals", "Automotive", "Chemicals", "Textiles", "Machinery"]
ZONES = [f"Zone-{c}" for c in "ABCDE"]

# ─────────────────────────────────────────────
# 1. PLANT → PORT MAPPING
# ─────────────────────────────────────────────
print("Generating PlantPorts...")
plant_port_map = {}
plant_port_rows = []
for plant in PLANTS:
    assigned_ports = random.sample(PORTS[:8], k=random.randint(1, 3))
    plant_port_map[plant] = assigned_ports
    for port in assigned_ports:
        plant_port_rows.append({"Plant_Code": plant, "Port": port})

df_plant_ports = pd.DataFrame(plant_port_rows)
df_plant_ports.to_csv("data/PlantPorts.csv", index=False)
print(f"  PlantPorts: {len(df_plant_ports)} rows")

# ─────────────────────────────────────────────
# 2. WAREHOUSE COSTS
# ─────────────────────────────────────────────
print("Generating WhCosts...")
wh_cost_rows = []
for plant in PLANTS:
    wh_cost_rows.append({
        "WH": plant,
        "Cost_per_unit": round(random.uniform(0.35, 2.50), 2)
    })
df_wh_costs = pd.DataFrame(wh_cost_rows)
df_wh_costs.to_csv("data/WhCosts.csv", index=False)
print(f"  WhCosts: {len(df_wh_costs)} rows")

# ─────────────────────────────────────────────
# 3. WAREHOUSE CAPACITIES
# ─────────────────────────────────────────────
print("Generating WhCapacities...")
wh_cap_rows = []
for plant in PLANTS:
    wh_cap_rows.append({
        "Plant_ID": plant,
        "Daily_Capacity": random.randint(8, 1200),
        "Max_SKUs": random.randint(50, 500),
        "Num_Aisles": random.randint(5, 30),
        "Num_Zones": random.randint(2, 6),
        "Sq_Footage": random.randint(5000, 80000)
    })
df_wh_caps = pd.DataFrame(wh_cap_rows)
df_wh_caps.to_csv("data/WhCapacities.csv", index=False)
print(f"  WhCapacities: {len(df_wh_caps)} rows")

# ─────────────────────────────────────────────
# 4. PRODUCTS PER PLANT
# ─────────────────────────────────────────────
print("Generating ProductsPerPlant...")
prod_plant_rows = []
product_plant_map = {}  # product -> list of plants
for product in PRODUCTS:
    assigned_plants = random.sample(PLANTS, k=random.randint(1, 4))
    product_plant_map[product] = assigned_plants
    for plant in assigned_plants:
        prod_plant_rows.append({"Plant_Code": plant, "Product_ID": product})

df_prod_plant = pd.DataFrame(prod_plant_rows)
df_prod_plant.to_csv("data/ProductsPerPlant.csv", index=False)
print(f"  ProductsPerPlant: {len(df_prod_plant)} rows")

# ─────────────────────────────────────────────
# 5. VMI CUSTOMERS
# ─────────────────────────────────────────────
print("Generating VmiCustomers...")
vmi_rows = []
vmi_plants = random.sample(PLANTS, k=8)
for plant in vmi_plants:
    num_vmi = random.randint(1, 5)
    for cust in random.sample(CUSTOMERS, k=num_vmi):
        vmi_rows.append({"Plant_Code": plant, "Customer": cust})
df_vmi = pd.DataFrame(vmi_rows)
df_vmi.to_csv("data/VmiCustomers.csv", index=False)
print(f"  VmiCustomers: {len(df_vmi)} rows")

# ─────────────────────────────────────────────
# 6. FREIGHT RATES
# ─────────────────────────────────────────────
print("Generating FreightRates...")
weight_bands = [
    (0, 99.99), (100, 249.99), (250, 499.99),
    (500, 1999.99), (2000, 99999.99)
]
tpt_days = [0, 1, 2, 3, 4, 5, 6, 14]
svc_codes = ["DTD", "DTP", "CRF"]

freight_rows = []
for carrier in CARRIERS:
    mode = random.choice(MODES)
    carrier_type = f"TYPE_{random.randint(0,3)}"
    orig_ports = random.sample(PORTS[:10], k=random.randint(2, 5))
    for orig in orig_ports:
        dest = "PORT09"
        for svc in random.sample(svc_codes, k=random.randint(1, 3)):
            tpt = random.choice(tpt_days)
            min_cost = round(random.uniform(1.5, 250.0), 2)
            for (wmin, wmax) in weight_bands:
                rate = round(random.uniform(0.03, 2.50), 2)
                freight_rows.append({
                    "Carrier": carrier,
                    "Orig_Port": orig,
                    "Dest_Port": dest,
                    "Min_Weight": wmin,
                    "Max_Weight": wmax,
                    "Service_Code": svc,
                    "Minimum_Cost": min_cost,
                    "Rate": rate,
                    "Mode": mode,
                    "Transit_Days": tpt,
                    "Carrier_Type": carrier_type
                })

df_freight = pd.DataFrame(freight_rows)
df_freight.to_csv("data/FreightRates.csv", index=False)
print(f"  FreightRates: {len(df_freight)} rows")

# ─────────────────────────────────────────────
# 7. ORDER LIST  (~50,000 orders)
# ─────────────────────────────────────────────
print("Generating OrderList (~50,000 rows)...")

dates = pd.date_range(start="2022-01-01", end="2024-12-31", freq="D")

order_rows = []
for i in range(50000):
    order_date = random.choice(dates)
    product    = random.choice(PRODUCTS)
    plants     = product_plant_map.get(product, [random.choice(PLANTS)])
    plant      = random.choice(plants)
    ports      = plant_port_map.get(plant, [random.choice(PORTS)])
    orig_port  = random.choice(ports)
    dest_port  = "PORT09"
    carrier    = random.choice(CARRIERS)
    customer   = random.choice(CUSTOMERS)
    svc_level  = random.choice(SERVICE_LEVELS)
    tpt        = random.randint(0, 14)
    ship_ahead = random.randint(0, 7)
    ship_late  = random.randint(0, 5)
    qty        = random.randint(100, 50000)
    weight     = round(qty * random.uniform(0.001, 0.5), 2)

    order_rows.append({
        "Order_ID": f"ORD{1400000 + i}.{random.randint(1,9)}",
        "Order_Date": order_date.strftime("%Y-%m-%d"),
        "Origin_Port": orig_port,
        "Carrier": carrier,
        "TPT": tpt,
        "Service_Level": svc_level,
        "Ship_Ahead_Days": ship_ahead,
        "Ship_Late_Days": ship_late,
        "Customer": customer,
        "Product_ID": product,
        "Plant_Code": plant,
        "Destination_Port": dest_port,
        "Unit_Quantity": qty,
        "Weight_KG": weight
    })

df_orders = pd.DataFrame(order_rows)
df_orders.to_csv("data/OrderList.csv", index=False)
print(f"  OrderList: {len(df_orders)} rows")

# ─────────────────────────────────────────────
# 8. WAREHOUSE PICKING DATA  (~36,500 rows)
#    Core ML dataset for demand forecasting
#    and route optimization
# ─────────────────────────────────────────────
print("Generating WarehousePickingData (~36,500 rows)...")

PRODUCT_SAMPLE = random.sample(PRODUCTS, 50)
PLANT_SAMPLE   = random.sample(PLANTS, 10)
all_dates      = pd.date_range(start="2023-01-01", end="2024-12-31", freq="D")

picking_rows = []
for product in PRODUCT_SAMPLE:
    plants = product_plant_map.get(product, [random.choice(PLANT_SAMPLE)])
    plant  = random.choice(plants)
    zone   = random.choice(ZONES)
    aisle  = random.randint(1, 25)
    category = random.choice(CATEGORIES)
    unit_price = round(random.uniform(5.0, 800.0), 2)
    reorder_pt = random.randint(40, 200)
    lead_time  = random.randint(1, 14)
    base_demand = random.randint(10, 120)
    inventory   = random.randint(200, 1500)

    for date in all_dates:
        seasonal = 12 * np.sin(2 * np.pi * date.dayofyear / 365)
        trend    = 0.015 * (date - all_dates[0]).days
        noise    = np.random.normal(0, 6)
        demand   = max(0, int(base_demand + seasonal + trend + noise))
        if date.dayofweek >= 5:
            demand = int(demand * 1.18)

        inventory = max(0, inventory - demand + random.randint(0, 40))
        pick_time = round(random.uniform(1.5, 18.0) + aisle * 0.35, 2)
        freight_cost = round(random.uniform(0.5, 15.0) * (demand / 100), 2)

        picking_rows.append({
            "order_id":          f"ORD{1500000 + len(picking_rows)}",
            "product_id":        product,
            "plant_code":        plant,
            "date":              date.strftime("%Y-%m-%d"),
            "demand":            demand,
            "inventory_level":   inventory,
            "warehouse_location": zone,
            "aisle_number":      aisle,
            "picking_time_min":  pick_time,
            "reorder_point":     reorder_pt,
            "lead_time_days":    lead_time,
            "unit_price":        unit_price,
            "category":          category,
            "day_of_week":       date.dayofweek,
            "month":             date.month,
            "quarter":           date.quarter,
            "is_weekend":        int(date.dayofweek >= 5),
            "week_of_year":      date.isocalendar()[1],
            "freight_cost_usd":  freight_cost,
            "service_level":     random.choice(SERVICE_LEVELS),
            "carrier":           random.choice(CARRIERS),
        })

df_picking = pd.DataFrame(picking_rows)

# Rolling features
df_picking["date"] = pd.to_datetime(df_picking["date"])
df_picking = df_picking.sort_values(["product_id", "date"])
df_picking["rolling_avg_7d"]  = (
    df_picking.groupby("product_id")["demand"]
    .transform(lambda x: x.rolling(7, min_periods=1).mean()).round(2)
)
df_picking["rolling_avg_30d"] = (
    df_picking.groupby("product_id")["demand"]
    .transform(lambda x: x.rolling(30, min_periods=1).mean()).round(2)
)
df_picking["demand_lag_1"]  = df_picking.groupby("product_id")["demand"].shift(1).fillna(0)
df_picking["demand_lag_7"]  = df_picking.groupby("product_id")["demand"].shift(7).fillna(0)
df_picking["demand_lag_30"] = df_picking.groupby("product_id")["demand"].shift(30).fillna(0)
df_picking["stockout_risk"] = (df_picking["inventory_level"] <= df_picking["reorder_point"]).astype(int)
df_picking["date"] = df_picking["date"].dt.strftime("%Y-%m-%d")

df_picking.to_csv("data/WarehousePickingData.csv", index=False)
print(f"  WarehousePickingData: {len(df_picking)} rows, {len(df_picking.columns)} columns")

# ─────────────────────────────────────────────
# 9. WAREHOUSE LAYOUT  (aisle graph for routing)
# ─────────────────────────────────────────────
print("Generating WarehouseLayout...")
layout_rows = []
for plant in PLANTS:
    num_aisles = df_wh_caps[df_wh_caps["Plant_ID"] == plant]["Num_Aisles"].values[0]
    for aisle in range(1, num_aisles + 1):
        zone = random.choice(ZONES)
        layout_rows.append({
            "plant_code":    plant,
            "aisle_number":  aisle,
            "zone":          zone,
            "aisle_length_m": round(random.uniform(10, 60), 1),
            "shelf_height_m": round(random.uniform(2.5, 8.0), 1),
            "capacity_units": random.randint(200, 2000),
            "pick_frequency": random.choice(["HIGH", "MEDIUM", "LOW"]),
            "distance_from_dock_m": round(random.uniform(5, 200), 1),
        })
df_layout = pd.DataFrame(layout_rows)
df_layout.to_csv("data/WarehouseLayout.csv", index=False)
print(f"  WarehouseLayout: {len(df_layout)} rows")

# ─────────────────────────────────────────────
# 10. PICKING ROUTES  (historical routes for RL training)
# ─────────────────────────────────────────────
print("Generating PickingRoutes...")
route_rows = []
for i in range(5000):
    plant = random.choice(PLANTS)
    num_aisles = df_wh_caps[df_wh_caps["Plant_ID"] == plant]["Num_Aisles"].values[0]
    num_stops  = random.randint(2, min(10, num_aisles))
    aisles_visited = random.sample(range(1, num_aisles + 1), k=num_stops)
    total_dist = round(sum(random.uniform(5, 30) for _ in range(num_stops)), 2)
    pick_time  = round(total_dist / 50 + random.uniform(0.5, 3.0), 2)
    route_rows.append({
        "route_id":          f"ROUTE_{i:06d}",
        "plant_code":        plant,
        "date":              random.choice(all_dates).strftime("%Y-%m-%d"),
        "picker_id":         f"PICKER_{random.randint(1,50):03d}",
        "aisles_visited":    str(sorted(aisles_visited)),
        "num_stops":         num_stops,
        "total_distance_m":  total_dist,
        "total_time_min":    pick_time,
        "items_picked":      random.randint(5, 80),
        "order_count":       random.randint(1, 10),
        "start_aisle":       1,
        "algorithm_used":    random.choice(["DIJKSTRA", "ASTAR", "GREEDY", "MANUAL"]),
        "optimized":         random.choice([0, 1]),
    })
df_routes = pd.DataFrame(route_rows)
df_routes.to_csv("data/PickingRoutes.csv", index=False)
print(f"  PickingRoutes: {len(df_routes)} rows")

# ─────────────────────────────────────────────
# 11. INVENTORY TRANSACTIONS
# ─────────────────────────────────────────────
print("Generating InventoryTransactions...")
txn_rows = []
txn_types = ["RECEIPT", "SHIPMENT", "ADJUSTMENT", "RETURN", "TRANSFER"]
for i in range(20000):
    product = random.choice(PRODUCT_SAMPLE)
    plant   = random.choice(product_plant_map.get(product, [random.choice(PLANTS)]))
    txn_date = random.choice(all_dates)
    txn_type = random.choice(txn_types)
    qty = random.randint(1, 5000) * (1 if txn_type in ["RECEIPT","RETURN"] else -1)
    txn_rows.append({
        "txn_id":       f"TXN_{i:08d}",
        "product_id":   product,
        "plant_code":   plant,
        "date":         txn_date.strftime("%Y-%m-%d"),
        "txn_type":     txn_type,
        "quantity":     abs(qty),
        "direction":    "IN" if qty > 0 else "OUT",
        "unit_cost":    round(random.uniform(1.0, 500.0), 2),
        "total_cost":   round(abs(qty) * random.uniform(1.0, 500.0), 2),
        "carrier":      random.choice(CARRIERS) if txn_type == "SHIPMENT" else None,
        "reference_order": f"ORD{random.randint(1400000,1450000)}" if txn_type == "SHIPMENT" else None,
    })
df_txn = pd.DataFrame(txn_rows)
df_txn.to_csv("data/InventoryTransactions.csv", index=False)
print(f"  InventoryTransactions: {len(df_txn)} rows")

# ─────────────────────────────────────────────
# 12. CARRIER PERFORMANCE
# ─────────────────────────────────────────────
print("Generating CarrierPerformance...")
carrier_perf_rows = []
for carrier in CARRIERS:
    for month in pd.date_range("2022-01-01", "2024-12-01", freq="MS"):
        carrier_perf_rows.append({
            "carrier":              carrier,
            "month":                month.strftime("%Y-%m"),
            "on_time_pct":          round(random.uniform(70, 99), 1),
            "avg_transit_days":     round(random.uniform(1, 14), 1),
            "damage_rate_pct":      round(random.uniform(0.1, 3.5), 2),
            "cost_per_kg":          round(random.uniform(0.05, 2.5), 3),
            "total_shipments":      random.randint(50, 5000),
            "total_weight_kg":      round(random.uniform(1000, 500000), 1),
            "avg_cost_per_shipment":round(random.uniform(10, 500), 2),
            "complaints":           random.randint(0, 50),
        })
df_carrier_perf = pd.DataFrame(carrier_perf_rows)
df_carrier_perf.to_csv("data/CarrierPerformance.csv", index=False)
print(f"  CarrierPerformance: {len(df_carrier_perf)} rows")

# ─────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────
print("\n" + "="*55)
print("DATASET GENERATION COMPLETE")
print("="*55)
files = {
    "OrderList.csv":              len(df_orders),
    "FreightRates.csv":           len(df_freight),
    "WhCosts.csv":                len(df_wh_costs),
    "WhCapacities.csv":           len(df_wh_caps),
    "ProductsPerPlant.csv":       len(df_prod_plant),
    "PlantPorts.csv":             len(df_plant_ports),
    "VmiCustomers.csv":           len(df_vmi),
    "WarehousePickingData.csv":   len(df_picking),
    "WarehouseLayout.csv":        len(df_layout),
    "PickingRoutes.csv":          len(df_routes),
    "InventoryTransactions.csv":  len(df_txn),
    "CarrierPerformance.csv":     len(df_carrier_perf),
}
total = 0
for fname, rows in files.items():
    print(f"  {fname:<35} {rows:>8,} rows")
    total += rows
print(f"  {'TOTAL':<35} {total:>8,} rows")
print("="*55)
print("All files saved to backend/data/")
