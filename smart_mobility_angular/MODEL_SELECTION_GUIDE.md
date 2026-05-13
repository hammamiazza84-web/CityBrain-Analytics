# Système de Sélection des Modèles ML

## Vue d'ensemble

Le système de sélection des modèles permet aux utilisateurs de choisir le meilleur modèle pour chaque section du dashboard (Stress, Transport, Infrastructure, PIML, Environnement) au lieu d'utiliser tous les modèles disponibles.

## Architecture

### Services
- **ModelSelectionService** (`src/app/services/model-selection.service.ts`): Service central de gestion des modèles
  - Gère la liste complète des modèles par section
  - Persiste les sélections dans localStorage
  - Expose les observables pour les mises à jour en temps réel

### Composants
- **DashboardComponent** (`src/app/components/dashboard/dashboard.component.ts`): Interface de sélection
  - Affiche une grille de sélection pour chaque section
  - Permet de voir la précision de chaque modèle
  - Affiche le nombre de sections configurées

- **ModelSelectorComponent** (`src/app/components/layout/model-selector/model-selector.component.ts`): Composant réutilisable
  - Sélecteur dropdown pour une section
  - Affiche les informations du modèle sélectionné
  - Émet les événements de sélection

## Utilisation dans les Formulaires de Prédiction

### Exemple: Ajouter un sélecteur dans Stress Predict

```typescript
// Dans stress-predict.component.ts
import { ModelSelectionService, Model } from '../../../services/model-selection.service';

export class StressPredictComponent implements OnInit {
  selectedModel: Model | undefined;
  
  constructor(
    private apiService: ApiService,
    private modelSelectionService: ModelSelectionService
  ) { }
  
  ngOnInit(): void {
    // Récupérer le modèle sélectionné
    this.selectedModel = this.modelSelectionService.getSelectedModel('stress');
    
    // S'abonner aux changements
    this.modelSelectionService.selectedModels$.subscribe(models => {
      this.selectedModel = models.get('stress');
    });
  }
  
  predict(): void {
    if (!this.selectedModel) {
      alert('Veuillez sélectionner un modèle');
      return;
    }
    
    // Utiliser le modèle sélectionné
    console.log('Modèle utilisé:', this.selectedModel.name);
    
    // Appeler l'API avec le modèle sélectionné
    this.apiService.predictStress(this.formData).subscribe({
      next: (data) => {
        // Traiter le résultat
      }
    });
  }
}
```

### Dans le template

```html
<div class="card">
  <div class="card-header">
    <h2 class="card-title">Sélection du Modèle</h2>
  </div>
  <div class="card-body">
    <!-- Utiliser le composant réutilisable -->
    <app-model-selector 
      [section]="'stress'"
      [label]="'Modèle de Prédiction Stress'"
      (modelSelected)="onModelSelected($event)">
    </app-model-selector>
  </div>
</div>

<!-- Formulaire de prédiction -->
<div class="card">
  <div class="card-body">
    <!-- ... formulaire ... -->
    <button (click)="predict()" [disabled]="!selectedModel">
      Prédire avec {{ selectedModel?.name }}
    </button>
  </div>
</div>
```

## Sections et Modèles Disponibles

### 1. Stress Prediction 🔮
- **Stress Classification (XGBoost)** - 89% - ✅ Défaut
- **Stress Random Forest** - 85%

### 2. Transport 🚌
- **Transport Prédiction Retard** - 82% - ✅ Défaut
- **Transport Anomalie Detection** - 88%

### 3. Infrastructure 🏗️
- **Infrastructure Classification** - 91% - ✅ Défaut
- **Infrastructure Regression** - 87%
- **Infrastructure Time Series** - 85%

### 4. PIML 📊
- **PIML Classification** - 86% - ✅ Défaut
- **PIML NLP C-G** - 84%

### 5. Environment 🌿
- **CO2 Environment** - 90% - ✅ Défaut
- **Pollution Detection** - 87%

### 6. Anomaly Detection 🔴
- **Anomalie Detection (ISO + SVM)** - 92% - ✅ Défaut
- **Anomalie LSTM** - 88%

## API du Service

### Méthodes principales

```typescript
// Récupérer les modèles d'une section
getModelsBySection(section: string): Model[]

// Récupérer le modèle sélectionné d'une section
getSelectedModel(section: string): Model | undefined

// Définir le modèle sélectionné d'une section
setSelectedModel(section: string, model: Model): void

// Récupérer tous les modèles
getAllModels(): Model[]

// Récupérer les modèles trié par précision
getModelsByAccuracy(section: string): Model[]

// Observable des modèles sélectionnés
selectedModels$: Observable<Map<string, Model>>
```

## Persistance des Données

Les sélections sont automatiquement sauvegardées dans `localStorage` sous la clé `selectedModels`. 

Format du stockage:
```json
{
  "stress": "stress-xgboost",
  "transport": "transport-retard",
  "infra": "infra-clf",
  "piml": "piml-c",
  "env": "env-co2",
  "anomaly": "anomaly-iso"
}
```

## Intégration avec les API Backend

Lors de l'appel à une API de prédiction, vous pouvez inclure l'ID du modèle sélectionné:

```typescript
predictStress(formData: any, modelId?: string): Observable<any> {
  const url = this.getApiUrl(`/stress/predict`);
  const body = { ...formData, model_id: modelId };
  return this.http.post(url, body);
}
```

Ensuite dans le composant:
```typescript
predict(): void {
  const modelId = this.selectedModel?.id;
  this.apiService.predictStress(this.formData, modelId).subscribe({
    next: (data) => { /* ... */ }
  });
}
```

## Prochaines Étapes

1. ✅ **Créé**: Service de gestion des modèles
2. ✅ **Créé**: Dashboard avec sélection de modèles
3. ✅ **Créé**: Composant réutilisable ModelSelectorComponent
4. ⏳ **À Faire**: Intégrer le sélecteur dans chaque formulaire de prédiction
5. ⏳ **À Faire**: Modifier les appels API pour utiliser le modèle sélectionné
6. ⏳ **À Faire**: Afficher dans les résultats le modèle utilisé

## Notes d'Implémentation

- Le composant SharedModule exporte CommonModule, FormsModule et ReactiveFormsModule
- Le ModelSelectorComponent doit être importé depuis SharedModule
- Tous les modules feature importent maintenant SharedModule
- Les sélections de modèles persistent au-delà des recharges de page
