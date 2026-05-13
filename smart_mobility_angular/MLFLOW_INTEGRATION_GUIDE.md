# Guide d'Intégration MLflow

## ✅ Composant Créé

Le composant `MlflowDashboardComponent` est maintenant disponible à l'URL :
```
/mlflow/tracking
```

## 📋 Qu'est-ce que MLflow ?

MLflow est une plateforme open-source pour gérer le cycle de vie complet du machine learning, incluant :

- **Tracking** : Enregistrer et visualiser les expérimentations
- **Models** : Gérer et déployer des modèles
- **Registry** : Versionner et gérer les modèles en production
- **Projects** : Packager le code ML de manière reproductible

## 🚀 Lancer MLflow

### Option 1 : Local (Développement)

```bash
# Installation
pip install mlflow

# Lancer le serveur UI
mlflow ui --host 0.0.0.0 --port 5000
```

Accès : `http://localhost:5003`

### Option 2 : Avec Backend Store (Production)

```bash
# Avec base de données SQLite
mlflow server \
  --backend-store-uri sqlite:///mlflow.db \
  --default-artifact-root ./mlruns \
  --host 0.0.0.0 \
  --port 5000
```

### Option 3 : Docker

```bash
docker run -p 5000:5000 \
  -v $(pwd)/mlruns:/mlruns \
  mlflow/mlflow:latest \
  mlflow server --host 0.0.0.0
```

## 🔧 Intégration avec Smart Mobility

### 1. Tracker vos expérimentations ML

Dans vos scripts Python de prédiction (stress, retard, etc.) :

```python
import mlflow
import mlflow.sklearn

# Configuration
mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("smart-mobility-predictions")

with mlflow.start_run():
    # Log des paramètres
    mlflow.log_param("model_type", "RandomForest")
    mlflow.log_param("n_estimators", 100)
    
    # Log des métriques
    mlflow.log_metric("accuracy", 0.95)
    mlflow.log_metric("f1_score", 0.92)
    
    # Log du modèle
    mlflow.sklearn.log_model(model, "model")
    
    # Log des artifacts (graphs, datasets)
    mlflow.log_artifact("confusion_matrix.png")
```

### 2. Configurer dans l'Application Angular

1. Connectez-vous (Manager)
2. Allez dans **Business Intelligence** → **MLflow Tracking**
3. Par défaut : `http://localhost:5000`
4. Modifiez si votre serveur est ailleurs

## 📊 Fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| 🔄 Rafraîchir | Recharger l'interface MLflow |
| ⚙️ Configurer | Changer l'URL du serveur |
| 🔗 Ouvrir MLflow | Ouvrir dans un nouvel onglet |
| 💾 Persistance | URL sauvegardée dans localStorage |

## 🏗️ Architecture Recommandée

```
Smart Mobility Angular (Frontend)
           │
           ▼
    +--------------+
    │  MLflow UI   │ ← Visualisation expérimentations
    │  (port 5000) │
    +--------------+
           │
           ▼
    +--------------+
    │  MLflow API  │ ← Tracking des runs
    │  (SQLite/    │
    │   PostgreSQL)│
    +--------------+
           │
           ▼
    +--------------+
    │   Modèles    │ ← Stockage des modèles
    │   (S3/local) │
    +--------------+
```

## 📝 Exemple d'Utilisation

### Suivi des prédictions de stress réseau :

```python
import mlflow
from datetime import datetime

mlflow.set_tracking_uri("http://localhost:5000")
mlflow.set_experiment("network-stress-prediction")

with mlflow.start_run(run_name=f"run_{datetime.now().strftime('%Y%m%d_%H%M%S')}"):
    # Paramètres
    mlflow.log_param("algorithm", "XGBoost")
    mlflow.log_param("features", ["cpu", "memory", "bandwidth"])
    
    # Métriques
    mlflow.log_metric("mse", 0.023)
    mlflow.log_metric("mae", 0.045)
    mlflow.log_metric("r2_score", 0.89)
    
    # Modèle
    mlflow.xgboost.log_model(xgb_model, "stress_predictor")
```

## 🎯 Prochaines Étapes

1. **Installez** MLflow : `pip install mlflow`
2. **Lancez** le serveur : `mlflow ui`
3. **Intégrez** le tracking dans vos scripts Python
4. **Visualisez** tout dans l'application Angular !

## 📚 Ressources

- [Documentation MLflow](https://mlflow.org/docs/latest/index.html)
- [MLflow Tracking](https://mlflow.org/docs/latest/tracking.html)
- [MLflow Models](https://mlflow.org/docs/latest/models.html)

---

**Prêt ?** Lancez `mlflow ui` et commencez à tracker vos expérimentations ! 🧪
