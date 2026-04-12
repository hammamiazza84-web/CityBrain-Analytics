#!/usr/bin/env python3
"""Tester sur des cas réels du dataset"""

import joblib
import pandas as pd
import numpy as np
import json
import os
import pyodbc
from sklearn.preprocessing import LabelEncoder

# Load artifacts
base = os.path.dirname(__file__)
best_model = joblib.load(os.path.join(base, 'best_model_ad.pkl'))
iso = joblib.load(os.path.join(base, 'iso_forest.pkl'))
ocsvm = joblib.load(os.path.join(base, 'ocsvm.pkl'))
sc_ad = joblib.load(os.path.join(base, 'scaler_ad.pkl'))
imp_ad = joblib.load(os.path.join(base, 'imputer_ad.pkl'))
le_dict = joblib.load(os.path.join(base, 'le_dict_ad.pkl'))

with open(os.path.join(base, 'ad_metadata.json')) as f:
    meta = json.load(f)

# Charger les données
SERVER = 'LAPTOP-53JPQ5UR'
DATABASE = 'ETL'
CONN_STR = (
    f'DRIVER={{ODBC Driver 17 for SQL Server}};'
    f'SERVER={SERVER};DATABASE={DATABASE};'
    f'Trusted_Connection=yes;TrustServerCertificate=yes;'
)

QUERY = """
SELECT TOP 10196
    f.Sentiment_Score,
    f.Stress_Level,
    dt.Year, dt.Month_Name, dt.Day_Name, dt.Hour_Interval,
    dt.Is_Weekend, dt.Peak_Status, dt.Season,
    dz.Name AS Zone_Name, dz.City, dz.Region, dz.Socio_Economic_Group,
    us.Category AS User_Category, us.Mobility_Profile
FROM dbo.Fact_User_Experience f
LEFT JOIN dbo.Dim_DateTime dt ON f.Date_Time_ID = dt.Date_Time_ID
LEFT JOIN dbo.Dim_Zone dz ON f.Zone_ID = dz.Zone_ID
LEFT JOIN dbo.Dim_User_Segment us ON f.User_ID = us.User_ID
"""

try:
    conn = pyodbc.connect(CONN_STR, timeout=30)
    cursor = conn.cursor()
    cursor.execute(QUERY)
    cols = [c[0] for c in cursor.description]
    rows = cursor.fetchall()
    df_raw = pd.DataFrame.from_records(rows, columns=cols)
    conn.close()
    print(f'✅ Données chargées : {len(df_raw):,} enregistrements')
except Exception as e:
    print(f'❌ Connexion échouée : {e}')
    raise

# Preprocessing
df_ad = df_raw.copy()
for col in df_ad.select_dtypes(include=['object']).columns:
    le = LabelEncoder()
    df_ad[col] = le.fit_transform(df_ad[col].astype(str))

X_ad = sc_ad.transform(imp_ad.transform(df_ad))

# Prédictions
iso_preds = iso.predict(X_ad)
ocsvm_preds = ocsvm.predict(X_ad)
best_preds = best_model.predict(X_ad)
best_scores = best_model.score_samples(X_ad)

# Ajouter au dataframe
df_raw['ISO_Pred'] = iso_preds
df_raw['OCSVM_Pred'] = ocsvm_preds
df_raw['Best_Pred'] = best_preds
df_raw['Best_Score'] = best_scores
df_raw['Both_Anomaly'] = (iso_preds == -1) & (ocsvm_preds == -1)

print("\n" + "="*90)
print("  🎯 EXEMPLES DE CAS RÉELS (Stress ≥ 4 ET Sentiment ≤ 2)")
print("="*90)

extreme_cases = df_raw[
    (df_raw['Stress_Level'] >= 4) & 
    (df_raw['Sentiment_Score'] <= 2)
].head(5)

print(f"\nTrouvés : {len(df_raw[(df_raw['Stress_Level'] >= 4) & (df_raw['Sentiment_Score'] <= 2)])} cas\n")

for i, (idx, row) in enumerate(extreme_cases.iterrows(), 1):
    iso_result = "🚨" if row['ISO_Pred'] == -1 else "✅"
    ocsvm_result = "🚨" if row['OCSVM_Pred'] == -1 else "✅"
    best_result = "🚨" if row['Best_Pred'] == -1 else "✅"
    
    print(f"Cas #{i}:")
    print(f"  Profil     : Stress={row['Stress_Level']} | Sentiment={row['Sentiment_Score']}")
    print(f"             | City={row['City']} | Category={row['User_Category']}")
    print(f"             | Hour={row['Hour_Interval']} | Peak={row['Peak_Status']}")
    print(f"  Prédictions:")
    print(f"             | Isolation Forest  : {iso_result}")
    print(f"             | One-Class SVM     : {ocsvm_result}")
    print(f"             | Meilleur modèle   : {best_result} (score={row['Best_Score']:.3f})")
    if row['Both_Anomaly']:
        print(f"  ✅ CONFIRMÉE comme anomalie par les 2 modèles")
    print()

print("="*90)
print("  📊 STATISTIQUES GLOBALES")
print("="*90)

n_iso_anom = (iso_preds == -1).sum()
n_ocsvm_anom = (ocsvm_preds == -1).sum()
n_both_anom = ((iso_preds == -1) & (ocsvm_preds == -1)).sum()
n_best_anom = (best_preds == -1).sum()

print(f"\n Détections par modèle:")
print(f"  • Isolation Forest    : {n_iso_anom:,} anomalies ({100*n_iso_anom/len(df_raw):.1f}%)")
print(f"  • One-Class SVM       : {n_ocsvm_anom:,} anomalies ({100*n_ocsvm_anom/len(df_raw):.1f}%)")
print(f"  • Confirmées (ACCORD) : {n_both_anom:,} anomalies ({100*n_both_anom/len(df_raw):.1f}%)")
print(f"  • Meilleur modèle     : {n_best_anom:,} anomalies ({100*n_best_anom/len(df_raw):.1f}%)")

print(f"\n Cas 'Stress >= 4 ET Sentiment <= 2':")
n_extreme = len(df_raw[(df_raw['Stress_Level'] >= 4) & (df_raw['Sentiment_Score'] <= 2)])
n_extreme_best = len(df_raw[
    (df_raw['Stress_Level'] >= 4) & 
    (df_raw['Sentiment_Score'] <= 2) &
    (df_raw['Best_Pred'] == -1)
])
print(f"  • Total trouvés       : {n_extreme} ({100*n_extreme/len(df_raw):.3f}%)")
print(f"  • Détectés anormaux   : {n_extreme_best} / {n_extreme} ({100*n_extreme_best/max(1,n_extreme):.0f}%)")

print("\n" + "="*90)
