import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-transport-anomaly',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🚨 Diagnostic des Perturbations de Trafic</h1>
      <p class="page-subtitle">Détection automatisée des ruptures de service et des flux irréguliers</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Données de Simulation</h2>
        </div>
        <div class="card-body">
          <div class="info-box">
            Analyse comparative entre les flux temps réel et les modèles de circulation historiques.
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Écart de temps observé (sec)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.retard" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Taux de remplissage (%)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.charge" min="0" max="100">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Heure de passage</label>
              <input type="number" class="form-control" [(ngModel)]="formData.hour" min="0" max="23">
            </div>
            <div class="form-group">
              <label class="form-label">Identifiant du Segment</label>
              <input type="number" class="form-control" [(ngModel)]="formData.segment_id" min="1">
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%; margin-top: 1rem;" (click)="detect()" [disabled]="loading">
            <span *ngIf="loading">⏳ Analyse des flux...</span>
            <span *ngIf="!loading">🚨 Lancer l'Analyse</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Rapport d'Intégrité du Trafic</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🛰️</div>
            <p>Le système de surveillance est prêt pour un audit de segment.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Identification des points de congestion...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getIsAnomaly() ? '#ff4d6a12' : '#00e5a012'" [style.border]="getIsAnomaly() ? '2px solid #ff4d6a40' : '2px solid #00e5a040'">
              <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 0.5rem;">Statut du Trajet :</div>
              <div [style.color]="getIsAnomaly() ? '#ff4d6a' : '#00e5a0'" style="font-size:32px;font-weight:800">
                {{ getIsAnomaly() ? 'PERTURBATION DÉTECTÉE' : 'FLUIDITÉ NOMINALE' }}
              </div>
              <div style="font-size:1rem;color:var(--c-text2); margin-top: 8px;">Indice de déviation : {{ getAnomalyScore() | number:'1.3' }}</div>
            </div>
            
            <div class="alert" [class]="getIsAnomaly() ? 'alert-error' : 'alert-success'" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Recommandation Stratégique :</div>
              {{ getTransportRecommendation() }}
            </div>

            <div class="card" style="background: rgba(255,255,255,0.03); border: none; margin-top: 1rem;">
              <div class="card-body" style="padding: 1rem; font-size: 0.9rem;">
                ℹ️ Cet audit permet d'identifier les goulets d'étranglement et de prioriser les interventions de régulation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-box { background: rgba(0, 194, 255, 0.08); border-left: 3px solid #00c2ff; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; font-size: 0.9rem; color: #8ba3c7; }
  `]
})
export class TransportAnomalyComponent {
  loading = false;
  result: any = null;
  formData = { retard: 200, charge: 50, hour: 8, segment_id: 10 };
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  detect() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/transport/anomaly_manual`, this.formData).pipe(
      catchError(err => { 
        this.loading = false; 
        this.cdr.markForCheck(); 
        return throwError(() => err); 
      })
    ).subscribe({
      next: (data: any) => { 
        this.result = data; 
        this.loading = false; 
        this.cdr.markForCheck(); 
      }
    });
  }

  getIsAnomaly(): boolean {
    if (!this.result) return false;
    return this.result.is_anomaly ?? this.result.anomaly ?? this.result.isAnomaly ?? false;
  }

  getAnomalyScore(): number {
    if (!this.result) return 0;
    return this.result.anomaly_score ?? this.result.score ?? this.result.anomalyScore ?? 0;
  }

  getTransportRecommendation(): string {
    if (this.getIsAnomaly()) {
      return "Alerte : Rupture de charge probable sur ce segment. Envisagez le redéploiement d'une rame de réserve et informez les agents de régulation.";
    }
    return "Circulation optimale : Le trajet s'inscrit dans les courbes de fluidité standards. Aucune mesure corrective nécessaire.";
  }
}