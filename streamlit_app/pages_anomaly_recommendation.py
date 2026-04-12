"""
Pages pour Anomaly Detection et Recommendation System
À intégrer dans app.py
"""

import streamlit as st
import pandas as pd
import numpy as np
import joblib
import json
import os
import plotly.express as px
import plotly.graph_objects as go
from sklearn.decomposition import PCA
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer


# ══════════════════════════════════════════════════════════════
# CHARGE LES ARTEFACTS AD
# ══════════════════════════════════════════════════════════════
@st.cache_resource
def load_anomaly_artifacts():
    base = os.path.dirname(__file__)
    try:
        iso = joblib.load(os.path.join(base, 'iso_forest.pkl'))
        ocsvm = joblib.load(os.path.join(base, 'ocsvm.pkl'))
        sc_ad = joblib.load(os.path.join(base, 'scaler_ad.pkl'))
        imp_ad = joblib.load(os.path.join(base, 'imputer_ad.pkl'))
        le_dict = joblib.load(os.path.join(base, 'le_dict_ad.pkl'))
        with open(os.path.join(base, 'ad_metadata.json')) as f:
            meta = json.load(f)
        return iso, ocsvm, sc_ad, imp_ad, le_dict, meta, None
    except Exception as e:
        return None, None, None, None, None, None, str(e)


# ══════════════════════════════════════════════════════════════
# CHARGE LES DONNÉES RECOMMANDATION
# ══════════════════════════════════════════════════════════════
@st.cache_data(ttl=600)
def load_recommendation_data():
    base = os.path.dirname(__file__)
    try:
        stress_matrix = pd.read_csv(os.path.join(base, 'stress_matrix.csv'))
        with open(os.path.join(base, 'ad_metadata.json')) as f:
            meta = json.load(f)
        return stress_matrix, meta, None
    except Exception as e:
        return None, None, str(e)


# ══════════════════════════════════════════════════════════════
# PAGE: ANOMALY DETECTION
# ══════════════════════════════════════════════════════════════
def _page_anomaly_detection():
    st.markdown('<div class="section-header">🔴 Anomaly Detection — Usagers en Stress Anormal</div>', unsafe_allow_html=True)
    
    iso, ocsvm, sc_ad, imp_ad, le_dict, meta, err = load_anomaly_artifacts()
    
    if err or iso is None:
        st.error(f"❌ Impossible de charger les modèles : {err}")
        st.info("👉 Exécutez d'abord `advanced_objectives.ipynb` pour générer les artefacts.")
        return
    
    st.success(f"✅ Modèles chargés — {meta.get('total_records', '?'):,} records analysés")
    
    # Afficher les images sauvegardées
    base = os.path.dirname(__file__)
    images_to_show = [
        ('assets/anomaly_detection_pca.png', 'PCA Visualization — Anomalies détectées'),
        ('assets/anomaly_heatmap.png', 'Heatmap — Taux d\'anomalies par Ville x Peak Status'),
        ('assets/anomaly_distributions.png', 'Distribution — Stress & Sentiment (Normal vs Anomalie)'),
    ]
    
    for img_path, title in images_to_show:
        full_path = os.path.join(base, img_path)
        if os.path.exists(full_path):
            st.markdown(f"#### {title}")
            st.image(full_path, use_container_width=True)
        else:
            st.warning(f"⚠️ Image non trouvée : {img_path}")
    
    # Afficher les métriques
    st.markdown("#### 📊 Résumé des modèles")
    col1, col2, col3, col4 = st.columns(4)
    
    n_iso = meta.get('n_anomalies_iso', 0)
    n_ocsvm = meta.get('n_anomalies_ocsvm', 0)
    n_both = meta.get('n_anomalies_both', 0)
    total = meta.get('total_records', 1)
    
    col1.metric("Isolation Forest", f"{n_iso} anomalies", f"{100*n_iso/total:.1f}%")
    col2.metric("One-Class SVM", f"{n_ocsvm} anomalies", f"{100*n_ocsvm/total:.1f}%")
    col3.metric("Confirmées (2 mod)", f"{n_both} anomalies", f"{100*n_both/total:.1f}%")
    col4.metric("Accord modèles", f"{100*(n_iso==n_ocsvm)/total:.1f}%", "Cohérence")
    
    # Test sur nouvelles données
    st.markdown("#### 🔮 Tester sur de nouvelles données")
    st.info("Remplis les champs ci-dessous pour détecter si un usager est en anomalie.")
    
    # Charger les options uniques depuis les métadatas ou données
    feature_cols = meta.get('feature_cols', [])
    
    with st.form("anomaly_form"):
        st.markdown("Paramètres d'entrée (simples valeurs)")
        
        # Input simplifiés (normalement on prendrait les vraies données)
        col1, col2 = st.columns(2)
        stress_level = col1.slider("Stress Level", 1, 5, 3)
        sentiment_score = col2.slider("Sentiment Score", 1, 5, 3)
        
        submitted = st.form_submit_button("🔴 Détecter une anomalie", use_container_width=True, type="primary")
    
    if submitted:
        # Créer un sample avec valeurs numériques
        sample_data = np.array([[stress_level, sentiment_score] + [0]*(len(feature_cols)-2)])
        sample_scaled = sc_ad.transform(sample_data)
        
        iso_pred = iso.predict(sample_scaled)[0]
        iso_score = iso.score_samples(sample_scaled)[0]
        
        ocsvm_pred = ocsvm.predict(sample_scaled)[0]
        ocsvm_score = ocsvm.score_samples(sample_scaled)[0]
        
        is_anomaly_iso = iso_pred == -1
        is_anomaly_ocsvm = ocsvm_pred == -1
        is_anomaly_both = is_anomaly_iso and is_anomaly_ocsvm
        
        col_result1, col_result2 = st.columns(2)
        
        with col_result1:
            color_iso = "#F44336" if is_anomaly_iso else "#4CAF50"
            label_iso = "🚨 ANOMALIE" if is_anomaly_iso else "✅ Normal"
            st.markdown(f"""
            <div class="kpi-card" style="border-left-color:{color_iso}">
                <div class="kpi-label">Isolation Forest</div>
                <div class="kpi-value" style="color:{color_iso}">{label_iso}</div>
                <div class="kpi-sub">Score: {iso_score:.4f}</div>
            </div>""", unsafe_allow_html=True)
        
        with col_result2:
            color_ocsvm = "#FF9800" if is_anomaly_ocsvm else "#4CAF50"
            label_ocsvm = "⚠️ ANOMALIE" if is_anomaly_ocsvm else "✅ Normal"
            st.markdown(f"""
            <div class="kpi-card" style="border-left-color:{color_ocsvm}">
                <div class="kpi-label">One-Class SVM</div>
                <div class="kpi-value" style="color:{color_ocsvm}">{label_ocsvm}</div>
                <div class="kpi-sub">Score: {ocsvm_score:.4f}</div>
            </div>""", unsafe_allow_html=True)
        
        if is_anomaly_both:
            st.error("🆘 ANOMALIE CONFIRMÉE par les deux modèles! Situation hautement anormale.")
        elif is_anomaly_iso or is_anomaly_ocsvm:
            st.warning("⚠️ Anomalie détectée par l'un des modèles. À surveiller.")
        else:
            st.success("✅ Aucune anomalie détectée. Situation normale.")


# ══════════════════════════════════════════════════════════════
# PAGE: RECOMMENDATION SYSTEM
# ══════════════════════════════════════════════════════════════
def _page_recommendation():
    st.markdown('<div class="section-header">🎯 Recommendation System — Créneaux à faible stress</div>', unsafe_allow_html=True)
    
    stress_matrix, meta, err = load_recommendation_data()
    
    if err or stress_matrix is None or stress_matrix.empty:
        st.error(f"❌ Impossible de charger la matrice de recommandation : {err}")
        st.info("👉 Exécutez d'abord `advanced_objectives.ipynb` pour générer les données.")
        return
    
    st.success(f"✅ Matrice de recommandation chargée — {len(stress_matrix):,} combinaisons uniques")
    
    # Afficher les images
    base = os.path.dirname(__file__)
    img_path = os.path.join(base, 'assets/recommendation_viz.png')
    if os.path.exists(img_path):
        st.markdown("#### 📊 Visualisations — Créneaux à faible stress")
        st.image(img_path, use_container_width=True)
    
    # Statistiques
    st.markdown("#### 📈 Statistiques globales")
    col1, col2, col3 = st.columns(3)
    col1.metric("Combinaisons unique", len(stress_matrix))
    col2.metric("Stress moyen global", f"{stress_matrix['Avg_Stress'].mean():.2f}")
    col3.metric("Meilleur créneau", f"{stress_matrix['Avg_Stress'].min():.2f}")
    
    # Tableau des meilleures combinaisons
    st.markdown("#### 🏆 Top 10 créneaux (stress le plus bas)")
    top_10 = stress_matrix.nsmallest(10, 'Avg_Stress')[
        [c for c in ['City','User_Category','Mobility_Profile','Hour_Interval','Peak_Status','Season','Avg_Stress','N_Records','Confidence'] 
         if c in stress_matrix.columns]
    ].reset_index(drop=True)
    top_10.index = top_10.index + 1
    st.dataframe(top_10, use_container_width=True)
    
    # Recommandations personnalisées
    st.markdown("#### 🎯 Recommandations personnalisées")
    st.info("Sélectionne un profil pour obtenir les meilleurs créneaux.")
    
    group_cols = [c for c in ['City','User_Category','Mobility_Profile'] if c in stress_matrix.columns]
    
    col_select1, col_select2, col_select3 = st.columns(3)
    
    with col_select1:
        if 'City' in group_cols:
            cities = sorted(stress_matrix['City'].dropna().unique())
            selected_city = st.selectbox("Ville", cities)
        else:
            selected_city = None
    
    with col_select2:
        if 'User_Category' in group_cols:
            cats = sorted(stress_matrix['User_Category'].dropna().unique())
            selected_cat = st.selectbox("Catégorie usager", cats)
        else:
            selected_cat = None
    
    with col_select3:
        if 'Mobility_Profile' in group_cols:
            profs = sorted(stress_matrix['Mobility_Profile'].dropna().unique())
            selected_prof = st.selectbox("Profil mobilité", profs)
        else:
            selected_prof = None
    
    # Filtrer et afficher
    mask = pd.Series([True] * len(stress_matrix))
    if selected_city:
        mask &= (stress_matrix['City'] == selected_city)
    if selected_cat:
        mask &= (stress_matrix['User_Category'] == selected_cat)
    if selected_prof:
        mask &= (stress_matrix['Mobility_Profile'] == selected_prof)
    
    filtered = stress_matrix[mask].nsmallest(5, 'Avg_Stress')
    
    if filtered.empty:
        st.warning("⚠️ Aucun créneau trouvé pour cette combinaison.")
    else:
        st.markdown(f"#### ✅ {len(filtered)} créneaux recommandés")
        
        for idx, (_, row) in enumerate(filtered.iterrows(), 1):
            stress_val = row['Avg_Stress']
            color = '#4CAF50' if stress_val < 2 else '#FF9800' if stress_val < 3 else '#F44336'
            label = '😊 Faible' if stress_val < 2 else '😐 Modéré' if stress_val < 3 else '😟 Élevé'
            
            creneaux_info = []
            for col in ['Hour_Interval', 'Peak_Status', 'Season']:
                if col in row.index:
                    creneaux_info.append(f"{col}={row[col]}")
            
            st.markdown(f"""
            <div class="kpi-card" style="border-left-color:{color}">
                <div class="kpi-label">Recommandation #{idx}</div>
                <div class="kpi-value" style="color:{color}">{label}</div>
                <div class="kpi-sub">{' · '.join(creneaux_info)}</div>
                <div style="margin-top:0.5rem;font-size:0.85rem;color:#666">
                    Stress: {stress_val:.3f} | Observations: {row['N_Records']} | Confiance: {row['Confidence']:.1%}
                </div>
            </div>""", unsafe_allow_html=True)
    
    # Heatmap Stress par Hour_Interval x Peak_Status
    st.markdown("#### 🔥 Heatmap — Stress par créneau horaire")
    if 'Hour_Interval' in stress_matrix.columns and 'Peak_Status' in stress_matrix.columns:
        hm = stress_matrix.groupby(['Hour_Interval', 'Peak_Status'])['Avg_Stress'].mean().unstack(fill_value=np.nan)
        fig = px.imshow(hm, color_continuous_scale='RdYlGn_r', aspect='auto',
                        labels={'Hour_Interval': 'Créneau horaire', 'Peak_Status': 'Période'},
                        title='Stress moyen par heure et période')
        fig.update_layout(height=300, paper_bgcolor='white')
        st.plotly_chart(fig, use_container_width=True)


# ════════════════════════════════════════════════════════════
# À appeler dans app.py comme:
# elif page == "🔴 Anomaly Detection":
#     _page_anomaly_detection()
# elif page == "🎯 Recommendation":
#     _page_recommendation()
