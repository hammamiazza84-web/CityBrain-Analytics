import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-stress-anomaly',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🔴 Surveillance des Comportements Atypiques</h1>
      <p class="page-subtitle">Détection préventive d'incidents et de saturations anormales sur le réseau</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Configuration de l'Audit</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Niveau de Stress Observé (1-5)</label>
              <select class="form-control" [(ngModel)]="formData.Stress_Level">
                <option *ngFor="let i of [1,2,3,4,5]" [value]="i">{{ i }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Indice de Satisfaction Usager (1-5)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.Sentiment_Score" min="1" max="5">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Période d'Analyse</label>
              <select class="form-control" [(ngModel)]="formData.Peak_Status">
                <option value="Peak">Heures de pointe</option>
                <option value="Off-Peak">Heures creuses</option>
                <option value="Night">Nuit</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Zone Urbaine</label>
              <select class="form-control" [(ngModel)]="formData.City">
                <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
              </select>
            </div>
          </div>
          
          <button class="btn btn-danger" style="width:100%" (click)="detect()" [disabled]="loading">
            <span *ngIf="loading">⏳ Analyse des flux...</span>
            <span *ngIf="!loading">🔍 Lancer le Diagnostic</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Diagnostic d'Integrité</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🚨</div>
            <p>Démarrez l'analyse pour identifier d'éventuelles anomalies opérationnelles.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="color: var(--c-text2); margin-top: 1rem;">Corrélation des données en cours...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="verdict" [class]="getVerdictClass(getVerdict())">
              {{ getVerdictIcon(getVerdict()) }} {{ getManagerVerdictLabel(getVerdict()) }}
            </div>
            
            <div class="alert" [class]="getAlertClass(getVerdict())" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Recommandation Opérationnelle :</div>
              {{ getAnomalyRecommendation() }}
            </div>
            
            <div class="model-cards" style="margin-top: 1.5rem;">
              <div class="model-card" [style.border-color]="isIsolationForestAnomaly() ? '#ff4d6a' : '#00e5a0'">
                <div class="model-card-title">Audit Statistique</div>
                <div class="model-card-value" [style.color]="isIsolationForestAnomaly() ? '#ff4d6a' : '#00e5a0'">
                  {{ isIsolationForestAnomaly() ? 'ATYPIQUE' : 'NOMINAL' }}
                </div>
              </div>
              
              <div class="model-card" [style.border-color]="isSVMAnomaly() ? '#ff4d6a' : '#00e5a0'">
                <div class="model-card-title">Audit Prédictif</div>
                <div class="model-card-value" [style.color]="isSVMAnomaly() ? '#ff4d6a' : '#00e5a0'">
                  {{ isSVMAnomaly() ? 'ALERTE' : 'NOMINAL' }}
                </div>
              </div>
            </div>
            
            <div *ngIf="isConfirmedByBoth()" class="alert alert-error" style="margin-top: 1.5rem;">
              ⚠️ <strong>Confirmation Critique :</strong> L'anomalie est validée par plusieurs moteurs d'analyse. Une vérification terrain est fortement conseillée.
            </div>
          </div>
          
          <div *ngIf="error" class="alert alert-error">
            ❌ Erreur lors de l'accès au moteur de détection.
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verdict { padding: 1.5rem; border-radius: 12px; font-size: 1.5rem; font-weight: 800; text-align: center; margin-bottom: 1rem; }
    .verdict-anomaly { background: rgba(255, 77, 106, 0.1); color: #ff4d6a; border: 2px solid rgba(255, 77, 106, 0.3); }
    .verdict-normal { background: rgba(0, 229, 160, 0.1); color: #00e5a0; border: 2px solid rgba(0, 229, 160, 0.3); }
    .verdict-warning { background: rgba(255, 170, 0, 0.1); color: #ffaa00; border: 2px solid rgba(255, 170, 0, 0.3); }
    .model-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .model-card { padding: 1.25rem; background: rgba(255, 255, 255, 0.03); border-radius: 10px; border-left: 4px solid #334155; }
    .model-card-title { font-size: 0.75rem; text-transform: uppercase; color: #8ba3c7; margin-bottom: 0.5rem; font-weight: 600; }
    .model-card-value { font-size: 1.2rem; font-weight: 800; }
  `]
})
export class StressAnomalyComponent {
  loading = false;
  result: any = null;
  error: string | null = null;
  
  cities = ['Paris', 'Lyon', 'Marseille'];
  
  formData = {
    Stress_Level: 3,
    Sentiment_Score: 2,
    Peak_Status: 'Peak',
    City: 'Paris',
    Year: '2024',
    Month_Name: 'June',
    Day_Name: 'Monday',
    Hour_Interval: '08:00 - 09:00',
    Is_Weekend: 'No',
    Season: 'Summer',
    Zone_Name: '',
    Region: '',
    Socio_Economic_Group: 'Middle',
    User_Category: 'metro',
    Mobility_Profile: 'High Stress'
  };
  
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) { }
  
  detect(): void {
    this.loading = true;
    this.error = null;
    this.result = null;
    this.cdr.markForCheck();
    
    this.apiService.detectAnomaly(this.formData).subscribe({
      next: (data) => {
        this.result = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = "Échec de l'analyse. Veuillez réessayer.";
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  getVerdict(): string {
    if (!this.result) return '';
    return this.result.verdict ?? this.result.status ?? '';
  }
  
  isAnomaly(): boolean {
    if (!this.result) return false;
    return this.result.is_anomaly ?? this.result.anomaly ?? this.result.isAnomaly ?? false;
  }
  
  isIsolationForestAnomaly(): boolean {
    if (!this.result?.isolation_forest) return false;
    return this.result.isolation_forest.is_anomaly ?? this.result.isolation_forest.anomaly ?? false;
  }
  
  isSVMAnomaly(): boolean {
    if (!this.result?.one_class_svm) return false;
    return this.result.one_class_svm.is_anomaly ?? this.result.one_class_svm.anomaly ?? false;
  }
  
  isConfirmedByBoth(): boolean {
    return this.isIsolationForestAnomaly() && this.isSVMAnomaly();
  }
  
  getVerdictClass(verdict: string): string {
    if (this.isAnomaly()) return 'verdict-anomaly';
    return 'verdict-normal';
  }
  
  getVerdictIcon(verdict: string): string {
    if (this.isAnomaly()) return '🚨';
    return '✅';
  }
  
  getManagerVerdictLabel(verdict: string): string {
    if (this.isAnomaly()) return 'COMPORTEMENT ATYPIQUE';
    return 'SITUATION NOMINALE';
  }
  
  getAlertClass(verdict: string): string {
    if (this.isAnomaly()) return 'alert-error';
    return 'alert-success';
  }

  getAnomalyRecommendation(): string {
    if (this.isAnomaly()) {
      return "Attention : Les paramètres saisis présentent une déviation par rapport aux normes historiques. Nous recommandons une surveillance accrue sur cette zone ou l'envoi d'un agent de médiation.";
    }
    return "Diagnostic positif : La situation correspond aux modèles de fluidité habituels. Aucune action particulière n'est requise.";
  }
}
