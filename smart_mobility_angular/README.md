# 🚦 Smart Mobility - Angular Frontend

Frontend Angular pour le projet Smart Mobility avec intégration ML.

## 📁 Structure du projet

```
smart_mobility_angular/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── sidebar/
│   │   │   ├── dashboard/
│   │   │   ├── stress/           ← ✅ Complet (3 composants)
│   │   │   │   ├── stress-predict/
│   │   │   │   ├── stress-anomaly/
│   │   │   │   └── stress-recommend/
│   │   │   ├── transport/        ← 📝 Placeholders (5 composants)
│   │   │   ├── infra/            ← 📝 Placeholders (5 composants)
│   │   │   ├── piml/             ← 📝 Placeholders (5 composants)
│   │   │   └── env/              ← ✅ CO2 Complet
│   │   ├── services/
│   │   │   └── api.service.ts    ← Service API
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── angular.json
├── package.json
├── tsconfig.json
└── proxy.conf.json
```

## 🚀 Installation et démarrage

### 1. Prérequis
- Node.js (v18+)
- npm (v9+)
- Backend Flask en cours d'exécution sur `http://localhost:5000`

### 2. Installation des dépendances
```bash
cd C:\Users\ghofr\Downloads\smart_mobility_angular
npm install
```

### 3. Lancer le serveur de développement
```bash
npm start
# ou
ng serve
```

L'application sera accessible sur `http://localhost:4200`

### 4. Build pour production
```bash
ng build --configuration production
```

## 🔌 Configuration API

Le proxy est configuré dans `proxy.conf.json` pour rediriger les appels `/api` vers le backend Flask sur le port 5000.

## 🎨 Composants créés

### ✅ Completement implémentés :
| Composant | Route | Description |
|-----------|-------|-------------|
| Stress Predict | `/stress/predict` | Prédiction niveau stress (XGBoost) |
| Stress Anomaly | `/stress/anomaly` | Détection anomalie (ISO + SVM) |
| Stress Recommend | `/stress/recommend` | Recommandation créneaux |
| Env CO2 | `/env/co2` | Prédiction émissions CO2 |
| Dashboard | `/dashboard` | Vue d'ensemble |

### 📝 Placeholders (à compléter) :
- Transport (5 composants)
- Infrastructure (5 composants)
- PIML C-G (5 composants)

## 🛠️ Technologies

- **Angular 17** - Framework frontend
- **TypeScript** - Langage de programmation
- **RxJS** - Programmation réactive
- **SCSS** - Préprocesseur CSS

## 📡 API Endpoints intégrés

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/stress/predict` | POST | Prédiction stress |
| `/api/stress/anomaly` | POST | Détection anomalie |
| `/api/stress/recommend` | POST | Recommandation |
| `/api/env/predict_co2` | POST | Prédiction CO2 |
| `/api/infra/*` | POST | Modèles infrastructure |
| `/api/transport/*` | POST | Modèles transport |
| `/api/piml/*/predict` | POST | Modèles PIML |

## 🔄 Prochaines étapes

1. **Compléter les composants placeholders** avec les formulaires et logiques spécifiques
2. **Ajouter des graphiques** avec Chart.js/ng2-charts
3. **Implémenter l'authentification** si nécessaire
4. **Ajouter des tests unitaires**
5. **Optimiser les performances** avec lazy loading

## 📞 Support

Pour toute question, référez-vous au backend Flask dans `smart_mobility_final/app.py`.
