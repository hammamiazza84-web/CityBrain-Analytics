# -*- coding: utf-8 -*-
"""
Application Flask pour déployer le modèle de prédiction de rendement de cultures
"""

from flask import Flask, request, jsonify
import joblib
import pickle
import numpy as np
import pandas as pd

app = Flask(__name__)

# Charger le modèle, le scaler et les encoders au démarrage
try:
    model = joblib.load("linear_regression_model.pkl")
    scaler = joblib.load("scaler.pkl")
    
    with open("label_encoders.pkl", "rb") as f:
        label_encoders = pickle.load(f)
    
    with open("feature_columns.pkl", "rb") as f:
        feature_columns = pickle.load(f)
    
    print("✅ Tous les modèles et préprocesseurs ont été chargés avec succès !")
except FileNotFoundError as e:
    print(f"❌ Erreur: Fichier manquant - {e}")
    print("Assurez-vous d'avoir exécuté ml.py pour générer les fichiers nécessaires.")
    raise

# Colonnes catégorielles à encoder
CATEGORICAL_COLUMNS = ['Region', 'Soil_Type', 'Crop', 'Fertilizer_Used', 'Irrigation_Used', 'Weather_Condition']


@app.route('/', methods=['GET'])
def home():
    """Page d'accueil avec documentation de l'API"""
    return jsonify({
        "message": "API de prédiction de rendement de cultures",
        "endpoints": {
            "/predict": "POST - Faire une prédiction",
            "/health": "GET - Vérifier l'état de l'API"
        },
        "exemple_requete": {
            "Region": "North",
            "Soil_Type": "Loamy",
            "Crop": "Wheat",
            "Fertilizer_Used": "Organic",
            "Irrigation_Used": "Yes",
            "Weather_Condition": "Sunny",
            "Rainfall_mm": 150.5,
            "Temperature_Celsius": 25.3,
            "Days_to_Harvest": 120
        }
    })


@app.route('/health', methods=['GET'])
def health():
    """Vérifier l'état de l'API"""
    return jsonify({
        "status": "healthy",
        "model_loaded": model is not None,
        "scaler_loaded": scaler is not None,
        "encoders_loaded": len(label_encoders) > 0
    })


@app.route('/predict', methods=['POST'])
def predict():
    """
    Faire une prédiction de rendement
    
    Format attendu (JSON):
    {
        "Region": "North",
        "Soil_Type": "Loamy",
        "Crop": "Wheat",
        "Fertilizer_Used": "Organic",
        "Irrigation_Used": "Yes",
        "Weather_Condition": "Sunny",
        "Rainfall_mm": 150.5,
        "Temperature_Celsius": 25.3,
        "Days_to_Harvest": 120
    }
    """
    try:
        # Vérifier que la requête contient du JSON
        if not request.is_json:
            return jsonify({"error": "La requête doit être au format JSON"}), 400
        
        data = request.json
        
        # Vérifier que toutes les colonnes nécessaires sont présentes
        missing_cols = set(feature_columns) - set(data.keys())
        if missing_cols:
            return jsonify({
                "error": f"Colonnes manquantes: {', '.join(missing_cols)}",
                "colonnes_requises": feature_columns
            }), 400
        
        # Créer un DataFrame avec les données reçues
        input_data = pd.DataFrame([data])
        
        # Encoder les variables catégorielles
        input_encoded = input_data.copy()
        for col in CATEGORICAL_COLUMNS:
            if col in input_encoded.columns:
                try:
                    # Vérifier si la valeur existe dans les classes de l'encoder
                    if data[col] not in label_encoders[col].classes_:
                        return jsonify({
                            "error": f"Valeur invalide pour '{col}': '{data[col]}'",
                            "valeurs_valides": label_encoders[col].classes_.tolist()
                        }), 400
                    
                    input_encoded[col] = label_encoders[col].transform([data[col]])[0]
                except KeyError:
                    return jsonify({
                        "error": f"Encoder manquant pour la colonne '{col}'"
                    }), 500
        
        # Réorganiser les colonnes dans le bon ordre
        input_encoded = input_encoded[feature_columns]
        
        # Normaliser les données
        input_scaled = scaler.transform(input_encoded)
        
        # Faire la prédiction
        prediction = model.predict(input_scaled)[0]
        
        # Retourner le résultat
        return jsonify({
            "prediction": float(prediction),
            "prediction_units": "tons_per_hectare",
            "input_data": data
        }), 200
        
    except ValueError as e:
        return jsonify({
            "error": "Erreur de validation des données",
            "details": str(e)
        }), 400
    
    except Exception as e:
        return jsonify({
            "error": "Erreur lors de la prédiction",
            "details": str(e)
        }), 500


if __name__ == "__main__":
    print("\n🚀 Démarrage de l'application Flask...")
    print("📡 API disponible sur: http://localhost:5000")
    print("📖 Documentation: http://localhost:5000/")
    print("❤️  Health check: http://localhost:5000/health")
    print("\nAppuyez sur Ctrl+C pour arrêter le serveur.\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000)



