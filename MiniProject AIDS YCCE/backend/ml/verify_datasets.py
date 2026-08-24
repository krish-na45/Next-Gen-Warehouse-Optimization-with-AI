import subprocess, sys, json

datasets = [
    'test_dataset_1_electronics_grocery.csv',
    'test_dataset_2_low_inventory.csv',
    'test_dataset_3_weekend_seasonal.csv',
    'test_dataset_4_industrial.csv',
    'test_dataset_5_no_labels.csv',
]

for ds in datasets:
    path = f'backend/data/{ds}'
    r = subprocess.run([sys.executable, 'backend/ml/batch_predict.py', path],
                       capture_output=True, text=True)
    out = json.loads(r.stdout)
    if 'error' in out:
        print(f'FAIL {ds}: {out["error"]}')
    else:
        m = out.get('metrics')
        if m:
            print(f'OK   {ds}')
            print(f'     rows={out["total_rows"]}, R2={m["r2"]}, MAE={m["mae"]}, RMSE={m["rmse"]}')
        else:
            print(f'OK   {ds}')
            print(f'     rows={out["total_rows"]}, predictions only (no labels)')
