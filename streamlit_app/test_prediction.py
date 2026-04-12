#!/usr/bin/env python3
"""Test the anomaly detection with corrected preprocessing"""

import joblib
import numpy as np
import pandas as pd
import json
import os

# Load artifacts
base = os.path.dirname(__file__)
iso = joblib.load(os.path.join(base, 'iso_forest.pkl'))
ocsvm = joblib.load(os.path.join(base, 'ocsvm.pkl'))
sc_ad = joblib.load(os.path.join(base, 'scaler_ad.pkl'))
imp_ad = joblib.load(os.path.join(base, 'imputer_ad.pkl'))
le_dict = joblib.load(os.path.join(base, 'le_dict_ad.pkl'))
best_model = joblib.load(os.path.join(base, 'best_model_ad.pkl'))

with open(os.path.join(base, 'ad_metadata.json')) as f:
    meta = json.load(f)

feature_cols = meta.get('feature_cols', [])
best_model_name = meta.get('best_model', 'Unknown')

print(f"🔧 Features: {feature_cols}")
print(f"🏆 Best model: {best_model_name}\n")

# Test case 1: Low stress + High sentiment (should be NORMAL)
print("="*60)
print("TEST 1: Stress=1, Sentiment=5 (Low Stress + High Sentiment)")
print("="*60)

stress_level = 1
sentiment_score = 5

# Create sample with medians
sample_dict = {}
for col in feature_cols:
    if col == 'Stress_Level':
        sample_dict[col] = stress_level
    elif col == 'Sentiment_Score':
        sample_dict[col] = sentiment_score
    else:
        sample_dict[col] = meta.get(f'median_{col}', 0)

sample_df = pd.DataFrame([sample_dict])
print(f"\n✅ Sample DataFrame:\n{sample_df}")

# Encoding
sample_df_encoded = sample_df.copy()
for col, encoder in le_dict.items():
    if col in sample_df_encoded.columns:
        try:
            sample_df_encoded[col] = encoder.transform(sample_df_encoded[col].astype(str))
        except:
            pass

print(f"\n✅ After encoding:\n{sample_df_encoded}")

# Imputation + Scaling
sample_df_imputed = imp_ad.transform(sample_df_encoded[feature_cols])
sample_scaled = sc_ad.transform(sample_df_imputed)

print(f"\n✅ After scaling (first 5 features):\n{sample_scaled[0, :5]}")

# Prediction with best model
pred = best_model.predict(sample_scaled)[0]
score = best_model.score_samples(sample_scaled)[0]

is_anomaly = pred == -1
result = "🚨 ANOMALIE" if is_anomaly else "✅ NORMAL"

print(f"\n📊 RESULTADO:")
print(f"  Prediction: {pred} (1=normal, -1=anomaly)")
print(f"  Score: {score:.4f}")
print(f"  Result: {result}")
print(f"  Model: {best_model_name}")

# Test case 2: High stress + Low sentiment (should be ANOMALY)
print("\n" + "="*60)
print("TEST 2: Stress=5, Sentiment=1 (High Stress + Low Sentiment)")
print("="*60)

stress_level = 5
sentiment_score = 1

sample_dict = {}
for col in feature_cols:
    if col == 'Stress_Level':
        sample_dict[col] = stress_level
    elif col == 'Sentiment_Score':
        sample_dict[col] = sentiment_score
    else:
        sample_dict[col] = meta.get(f'median_{col}', 0)

sample_df = pd.DataFrame([sample_dict])
sample_df_encoded = sample_df.copy()
for col, encoder in le_dict.items():
    if col in sample_df_encoded.columns:
        try:
            sample_df_encoded[col] = encoder.transform(sample_df_encoded[col].astype(str))
        except:
            pass

sample_df_imputed = imp_ad.transform(sample_df_encoded[feature_cols])
sample_scaled = sc_ad.transform(sample_df_imputed)

pred = best_model.predict(sample_scaled)[0]
score = best_model.score_samples(sample_scaled)[0]

is_anomaly = pred == -1
result = "🚨 ANOMALIE" if is_anomaly else "✅ NORMAL"

print(f"\n📊 RESULTADO:")
print(f"  Prediction: {pred} (1=normal, -1=anomaly)")
print(f"  Score: {score:.4f}")
print(f"  Result: {result}")
print(f"  Model: {best_model_name}")

# Test case 3: Medium values (should be NORMAL)
print("\n" + "="*60)
print("TEST 3: Stress=3, Sentiment=3 (Medium values)")
print("="*60)

stress_level = 3
sentiment_score = 3

sample_dict = {}
for col in feature_cols:
    if col == 'Stress_Level':
        sample_dict[col] = stress_level
    elif col == 'Sentiment_Score':
        sample_dict[col] = sentiment_score
    else:
        sample_dict[col] = meta.get(f'median_{col}', 0)

sample_df = pd.DataFrame([sample_dict])
sample_df_encoded = sample_df.copy()
for col, encoder in le_dict.items():
    if col in sample_df_encoded.columns:
        try:
            sample_df_encoded[col] = encoder.transform(sample_df_encoded[col].astype(str))
        except:
            pass

sample_df_imputed = imp_ad.transform(sample_df_encoded[feature_cols])
sample_scaled = sc_ad.transform(sample_df_imputed)

pred = best_model.predict(sample_scaled)[0]
score = best_model.score_samples(sample_scaled)[0]

is_anomaly = pred == -1
result = "🚨 ANOMALIE" if is_anomaly else "✅ NORMAL"

print(f"\n📊 RESULTADO:")
print(f"  Prediction: {pred} (1=normal, -1=anomaly)")
print(f"  Score: {score:.4f}")
print(f"  Result: {result}")
print(f"  Model: {best_model_name}")

print("\n" + "="*60)
print("✅ ALL TESTS COMPLETED")
print("="*60)
