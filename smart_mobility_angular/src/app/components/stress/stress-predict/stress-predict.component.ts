import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-stress-predict',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🔮 Analyse du Confort Usager</h1>
      <p class="page-subtitle">Anticipation du niveau de stress et de saturation du réseau</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Configuration de la Simulation</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Zone Urbaine</label>
              <select class="form-control" [(ngModel)]="formData.City">
                <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Période de la journée</label>
              <select class="form-control" [(ngModel)]="formData.Peak_Status">
                <option value="Peak">Heures de pointe</option>
                <option value="Off-Peak">Heures creuses</option>
                <option value="Night">Nuit</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mode de Transport principal</label>
              <select class="form-control" [(ngModel)]="formData.User_Category">
                <option value="metro">Métro / RER</option>
                <option value="bus">Réseau Bus</option>
                <option value="tram">Tramway</option>
                <option value="vélo">Mobilités Douces (Vélo)</option>
                <option value="voiture">Véhicule Individuel</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Profil de l'usager</label>
              <select class="form-control" [(ngModel)]="formData.Mobility_Profile">
                <option value="Low Stress">Habitué (Serein)</option>
                <option value="High Stress">Occasionnel (Sensible)</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Saisonnalité</label>
              <select class="form-control" [(ngModel)]="formData.Season">
                <option value="Summer">Été / Vacances</option>
                <option value="Spring">Printemps</option>
                <option value="Autumn">Automne</option>
                <option value="Winter">Hiver / Intempéries</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Jour de la semaine</label>
              <select class="form-control" [(ngModel)]="formData.Is_Weekend">
                <option value="No">Semaine (Travail)</option>
                <option value="Yes">Week-end / Loisirs</option>
              </select>
            </div>
          </div>
          
          <div class="form-group" style="margin-bottom:16px">
            <label class="form-label">Indice de satisfaction actuel : <strong style="color:var(--c-accent)">{{ formData.Sentiment_Score }}/5</strong></label>
            <input type="range" min="1" max="5" [(ngModel)]="formData.Sentiment_Score" style="width:100%;accent-color:var(--c-accent);margin-top:5px">
          </div>
          
          <button class="btn btn-success" style="width:100%" (click)="predict()" [disabled]="loading">
            <span *ngIf="loading">⏳ Analyse...</span>
            <span *ngIf="!loading">🚀 Lancer la Simulation</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Diagnostic Décisionnel</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="result-container" style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
            <p style="color: var(--c-text2); text-align: center;">En attente de paramètres pour générer le diagnostic.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 2rem;">
            <div class="spinner"></div>
            <p style="color: var(--c-text2); margin-top: 1rem;">Calcul de l'indice de confort...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getColor() + '12'" [style.border]="'2px solid ' + getColor() + '40'">
              <div class="result-emoji">{{ emojis[getPrediction()] || '❓' }}</div>
              <div>
                <div class="result-title" [style.color]="getColor()">{{ getManagerLabel(getPrediction()) }}</div>
                <div class="result-meta">Fiabilité du diagnostic : {{ (getConfidence() * 100).toFixed(1) }}%</div>
              </div>
            </div>
            
            <div style="margin-top: 1.5rem;">
              <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 1rem;">Probabilités par niveau de confort</h4>
              <div class="progress-bar-container" *ngFor="let prob of probabilities; trackBy: trackByLabel">
                <div class="progress-bar-header">
                  <span>{{ getManagerLabelByProb(prob.label) }}</span>
                  <span>{{ prob.value }}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-bar-fill" [style.width.%]="prob.percent" [style.background]="getColor()"></div>
                </div>
              </div>
            </div>
            
            <div class="alert" [class]="getAlertClass(getPrediction())" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Recommandation Stratégique :</div>
              {{ getRecommendation() }}
            </div>
          </div>
          
          <div *ngIf="error" class="alert alert-error">
            ❌ Une erreur est survenue lors de l'analyse. Veuillez vérifier la connexion au moteur d'intelligence.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StressPredictComponent {
  loading = false;
  result: any = null;
  error: string | null = null;
  probabilities: any[] = [];
  
  cities = ['Paris', 'Lyon', 'Marseille', 'Bordeaux'];
  
  emojis: { [key: number]: string } = {
    1: '😊', 2: '😐', 3: '😟', 4: '😰', 5: '🤯'
  };
  
  formData = {
    City: 'Paris',
    Peak_Status: 'Peak',
    Season: 'Summer',
    User_Category: 'metro',
    Mobility_Profile: 'High Stress',
    Is_Weekend: 'No',
    Sentiment_Score: 3,
    Hour_Interval: '08:00 - 09:00',
    Year: '2024',
    Month_Name: 'June',
    Day_Name: 'Monday',
    Zone_Name: 'Paris 1er',
    Region: 'Ile-de-France',
    Socio_Economic_Group: 'Middle'
  };
  
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) { }
  
  predict(): void {
    this.loading = true;
    this.error = null;
    this.result = null;
    this.probabilities = [];
    this.cdr.markForCheck();
    
    this.apiService.predictStress(this.formData).subscribe({
      next: (data) => {
        this.result = data;
        this.probabilities = this.calculateProbabilities(data);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err;
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  private calculateProbabilities(data: any): any[] {
    if (!data?.probabilities) return [];
    return Object.entries(data.probabilities).map(([key, value]) => ({
      label: key.replace(/_/g, ' ').toUpperCase(),
      value: ((value as number) * 100).toFixed(1),
      percent: (value as number) * 100
    }));
  }
  
  trackByLabel(index: number, item: any): string {
    return item.label;
  }
  
  getAlertClass(level: number): string {
    if (level >= 4) return 'alert-error';
    if (level >= 3) return 'alert-warning';
    return 'alert-success';
  }
  getManagerLabel(level: number): string {
    const labels: { [key: number]: string } = {
      1: 'Confort Optimal',
      2: 'Flux Fluide',
      3: 'Tension Modérée',
      4: 'Saturation Élevée',
      5: 'Saturation Critique'
    };
    return labels[level] || 'Analyse en cours';
  }

  getManagerLabelByProb(label: string): string {
    // Mapping from probability labels (e.g., "LEVEL 5") to professional labels
    const level = parseInt(label.replace(/[^0-9]/g, ''));
    if (!isNaN(level)) return this.getManagerLabel(level);
    return label;
  }

  getPrediction(): number {
    if (!this.result) return 0;
    return this.result.prediction ?? this.result.level ?? this.result.stress_level ?? 0;
  }
  getLabel(): string {
    if (!this.result) return '';
    return this.result.label ?? this.result.category ?? '';
  }
  getConfidence(): number {
    if (!this.result) return 0;
    return this.result.confidence ?? this.result.probability ?? this.result.score ?? 0;
  }
  getColor(): string {
    if (!this.result) return '#00e5a0';
    return this.result.color ?? this.getDefaultColor(this.getPrediction());
  }
  getRecommendation(): string {
    if (!this.result) return '';
    return this.result.recommendation ?? this.result.message ?? this.getDefaultRecommendation(this.getPrediction());
  }
  private getDefaultColor(level: number): string {
    if (level >= 4) return '#ff4d6a';
    if (level >= 3) return '#ff8f3c';
    if (level >= 2) return '#ffd93d';
    return '#00e5a0';
  }
  private getDefaultRecommendation(level: number): string {
    if (level >= 4) return 'Niveau de stress très élevé. Envisagez des alternatives de transport.';
    if (level >= 3) return 'Stress modéré. Planifiez votre trajet en conséquence.';
    if (level >= 2) return 'Léger stress. Conditions normales.';
    return 'Pas de stress significatif détecté.';
  }
}
