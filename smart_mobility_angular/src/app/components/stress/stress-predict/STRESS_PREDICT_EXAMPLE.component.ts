# Exemple d'Intégration: Stress Predict avec ModelSelectorComponent

## Fichier TypeScript

```typescript
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { ModelSelectionService, Model } from '../../../services/model-selection.service';

@Component({
  selector: 'app-stress-predict',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
export class StressPredictComponent implements OnInit {
  loading = false;
  result: any = null;
  error: string | null = null;
  probabilities: any[] = [];
  selectedModel: Model | undefined;
  
  cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux'];
  
  formData = {
    City: 'Paris',
    Peak_Status: 'Peak',
    Season: 'Summer',
    User_Category: 'metro',
    Mobility_Profile: 'High Stress',
    Is_Weekend: 'No',
    Sentiment_Score: 3
  };
  
  constructor(
    private apiService: ApiService,
    private modelSelectionService: ModelSelectionService,
    private cdr: ChangeDetectorRef
  ) { }
  
  ngOnInit(): void {
    // Récupérer le modèle sélectionné au chargement
    this.selectedModel = this.modelSelectionService.getSelectedModel('stress');
    
    // S'abonner aux changements du modèle sélectionné
    this.modelSelectionService.selectedModels$.subscribe(models => {
      this.selectedModel = models.get('stress');
      this.cdr.markForCheck();
    });
  }

  onModelSelected(model: Model): void {
    this.selectedModel = model;
    console.log('Modèle sélectionné:', model.name);
    this.cdr.markForCheck();
  }
  
  predict(): void {
    if (!this.selectedModel) {
      this.error = 'Veuillez sélectionner un modèle avant de faire une prédiction';
      return;
    }

    this.loading = true;
    this.error = null;
    this.result = null;
    this.cdr.markForCheck();
    
    // Inclure l'ID du modèle sélectionné dans la requête API
    const requestData = {
      ...this.formData,
      model_id: this.selectedModel.id
    };
    
    this.apiService.predictStress(requestData).subscribe({
      next: (data) => {
        this.result = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la prédiction';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
}
```

## Template HTML

```html
<div class="page-header">
  <h1 class="page-title">🔮 Stress Usager — Prédiction</h1>
  <p class="page-subtitle">Sélectionnez le modèle et faites une prédiction</p>
</div>

<div class="grid-2">
  <!-- Card 1: Model Selector -->
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">Sélection du Modèle</h2>
    </div>
    <div class="card-body">
      <!-- Composant réutilisable de sélection -->
      <app-model-selector 
        [section]="'stress'"
        [label]="'Modèle de Prédiction Stress'"
        (modelSelected)="onModelSelected($event)">
      </app-model-selector>
      
      <!-- Afficher les infos du modèle sélectionné -->
      <div *ngIf="selectedModel" class="model-info-box" style="margin-top: 1rem;">
        <p style="margin: 0; font-size: 0.9rem; color: var(--c-text2);">
          <strong style="color: var(--c-text);">Modèle actif:</strong> {{ selectedModel?.name }}
        </p>
        <p style="margin: 0.25rem 0 0 0; font-size: 0.85rem; color: var(--c-text2);">
          {{ selectedModel?.description }}
        </p>
      </div>
    </div>
  </div>
  
  <!-- Card 2: Prediction Form -->
  <div class="card">
    <div class="card-header">
      <h2 class="card-title">Paramètres de prédiction</h2>
    </div>
    <div class="card-body">
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Ville</label>
          <select class="form-control" [(ngModel)]="formData.City">
            <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Peak Status</label>
          <select class="form-control" [(ngModel)]="formData.Peak_Status">
            <option>Peak</option>
            <option>Off-Peak</option>
            <option>Night</option>
          </select>
        </div>
      </div>
      
      <button 
        class="btn btn-success" 
        style="width:100%" 
        (click)="predict()" 
        [disabled]="!selectedModel || loading">
        <span *ngIf="loading">⏳</span>
        <span *ngIf="!loading">🔮</span>
        {{ loading ? 'Prédiction...' : 'Prédire avec ' + (selectedModel?.name || 'le modèle sélectionné') }}
      </button>
    </div>
  </div>
</div>

<!-- Results Card -->
<div class="card" style="margin-top: 1rem;">
  <div class="card-header">
    <h2 class="card-title">Résultat</h2>
  </div>
  <div class="card-body">
    <div *ngIf="!result && !loading" class="result-container">
      <p style="color: var(--c-text2); text-align: center;">
        Sélectionnez un modèle et remplissez les paramètres
      </p>
    </div>
    
    <div *ngIf="loading" class="text-center">
      <p style="color: var(--c-text2);">⏳ Analyse en cours...</p>
    </div>
    
    <div *ngIf="result && !loading">
      <p style="color: var(--c-text);">
        <strong>Prédiction effectuée avec le modèle:</strong> {{ selectedModel?.name }}
      </p>
      <p style="color: var(--c-text2);">{{ result.prediction }}</p>
    </div>
    
    <div *ngIf="error" class="alert alert-error">
      ❌ {{ error }}
    </div>
  </div>
</div>
```

## Points clés de l'implémentation

1. **Injection du service**: `ModelSelectionService` est injecté dans le composant
2. **Récupération du modèle au démarrage**: `ngOnInit()` récupère le modèle sélectionné
3. **Observation des changements**: S'abonne à `selectedModels$` pour réagir aux changements
4. **Vérification avant prédiction**: Vérifie qu'un modèle est sélectionné
5. **Transmission du modèle à l'API**: Inclut `model_id` dans la requête
6. **Affichage du modèle utilisé**: Affiche le modèle dans les résultats

## Intégration dans le module

Assurez-vous que `SharedModule` est importé dans le module feature (déjà fait dans tous les modules):

```typescript
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [ StressPredictComponent ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    SharedModule  // ✅ Ceci expose le ModelSelectorComponent
  ]
})
export class StressModule { }
```
