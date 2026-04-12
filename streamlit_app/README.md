# 🚦 Smart Mobility — Stress Prediction & Clustering

Machine Learning application for stress level prediction and user segmentation in smart mobility systems.

## 📊 Project Structure

```
.
├── app.py                          # Main Streamlit application
├── pages_anomaly_recommendation.py # Anomaly detection & recommendations
├── show_anomalies.py              # Anomaly visualization
├── test_prediction.py             # Model prediction tests
├── test_real_cases.py             # Real case validation
├── ml_complet_fixed.ipynb         # Complete ML pipeline (training)
├── advanced_objectives.ipynb      # Advanced analysis & objectives
├── assets/                        # Images and resources
├── *.pkl                          # Trained models
├── metadata.json                  # Model metadata
└── stress_matrix.csv              # Stress level data
```

## 🎯 Features

- **📈 Dashboard** : KPI overview with real-time metrics
- **🔮 Real-Time Prediction** : Predict stress levels for new users
- **📊 Model Comparison** : Compare multiple ML models
- **🔵 Clustering** : User segmentation (K-Means, DBSCAN, Hierarchical)
- **⚠️ Anomaly Detection** : Detect and flag unusual patterns
- **📉 Time Series Forecasting** : 14+ days ahead predictions (SARIMA, Prophet)

## 🚀 Quick Start

### Requirements
```bash
pip install streamlit pandas scikit-learn prophet statsmodels pmdarima pyodbc joblib plotly numpy scipy
```

### Run the App
```bash
streamlit run app.py
```

The app will open at `http://localhost:8501`

## 📝 Data Source

- **Server** : LAPTOP-53JPQ5UR
- **Database** : ETL
- **Tables** : 
  - `dbo.Fact_User_Experience` (measurements)
  - `dbo.Dim_DateTime` (timestamps)
  - `dbo.Dim_Zone` (locations)
  - `dbo.Dim_User_Segment` (user categories)

## 🤖 Models Used

- **Stress Level Prediction** : Random Forest, XGBoost
- **Time Series** : SARIMA (auto-optimized), Prophet
- **Clustering** : K-Means, DBSCAN, Hierarchical Clustering
- **Anomaly Detection** : Isolation Forest, One-Class SVM

## 📊 Recent Improvements

✅ Auto-optimized SARIMA forecasting with pmdarima  
✅ Adaptive Prophet changepoint detection  
✅ Improved UI with better time series visualization  
✅ Fixed input visibility in dark sidebar  

## 👤 Author

Ghofranne

## 📄 License

MIT
