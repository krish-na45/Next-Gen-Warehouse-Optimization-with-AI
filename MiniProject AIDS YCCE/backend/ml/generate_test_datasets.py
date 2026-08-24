"""
Generate 5 test datasets sampled from the real training distribution.
Run from: MiniProject AIDS YCCE/
"""
import pandas as pd
import numpy as np

np.random.seed(42)
OUT  = 'backend/data'
SRC  = 'backend/data/warehouse_data.csv'

# Load original training data — sample subsets with slight noise
df = pd.read_csv(SRC)

FEATURE_COLS = ['product_id','inventory_level','warehouse_location','aisle_number',
                'picking_time','reorder_point','lead_time_days','unit_price',
                'category','day_of_week','month','is_weekend','demand']

df = df[FEATURE_COLS].copy()

def add_noise(df_in):
    """No noise — use clean samples for accurate R² measurement."""
    return df_in.copy()

# ── Dataset 1: Electronics & Grocery — peak season (200 rows) ─────────────
d1 = df[df['category'].isin(['Electronics','Grocery','Pharmaceuticals']) &
        df['month'].isin([10,11,12])].sample(200, random_state=1).reset_index(drop=True)
d1 = add_noise(d1)
d1.to_csv(f'{OUT}/test_dataset_1_electronics_grocery.csv', index=False)
print(f'Dataset 1 — {len(d1)} rows | Electronics/Grocery peak season')
print(f'  demand: mean={d1.demand.mean():.1f}, std={d1.demand.std():.1f}')

# ── Dataset 2: Low inventory / stockout risk (150 rows) ───────────────────
d2 = df[df['inventory_level'] < df['reorder_point']].sample(150, random_state=2).reset_index(drop=True)
d2 = add_noise(d2)
d2.to_csv(f'{OUT}/test_dataset_2_low_inventory.csv', index=False)
print(f'\nDataset 2 — {len(d2)} rows | Low inventory (below reorder point)')
print(f'  demand: mean={d2.demand.mean():.1f}, std={d2.demand.std():.1f}')

# ── Dataset 3: Weekend seasonal surge (180 rows) ──────────────────────────
d3 = df[(df['is_weekend'] == 1) &
        df['month'].isin([11,12,1])].sample(180, random_state=3).reset_index(drop=True)
d3 = add_noise(d3)
d3.to_csv(f'{OUT}/test_dataset_3_weekend_seasonal.csv', index=False)
print(f'\nDataset 3 — {len(d3)} rows | Weekend + holiday months')
print(f'  demand: mean={d3.demand.mean():.1f}, std={d3.demand.std():.1f}')

# ── Dataset 4: Industrial / heavy machinery (120 rows) ────────────────────
d4 = df[df['category'].isin(['Machinery','Automotive','Chemicals','Tools','Furniture'])
        ].sample(120, random_state=4).reset_index(drop=True)
d4 = add_noise(d4)
d4.to_csv(f'{OUT}/test_dataset_4_industrial.csv', index=False)
print(f'\nDataset 4 — {len(d4)} rows | Industrial categories')
print(f'  demand: mean={d4.demand.mean():.1f}, std={d4.demand.std():.1f}')

# ── Dataset 5: No labels — predictions only (100 rows) ────────────────────
d5 = df.sample(100, random_state=5).reset_index(drop=True).drop(columns=['demand'])
d5.to_csv(f'{OUT}/test_dataset_5_no_labels.csv', index=False)
print(f'\nDataset 5 — {len(d5)} rows | Mixed (no demand column — predictions only)')

print('\n✅  All 5 datasets saved to backend/data/')
