import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-infra-anomaly',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🛡️ Audit d'Intégrité des Infrastructures</h1>
      <p class="page-subtitle">Détection précoce des défaillances et des surconsommations énergétiques</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Paramètres de l'Actif</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Consommation Électrique (kWh)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.station_energy" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Volume de Service (Déchets kg)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.waste_collected" min="0">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Identifiant Infrastructure</label>
              <input type="number" class="form-control" [(ngModel)]="formData.infrastructure_id" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Heure d'Analyse</label>
              <input type="number" class="form-control" [(ngModel)]="formData.hour" min="0" max="23">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type d'Actif Urbain</label>
              <select class="form-control" [(ngModel)]="formData.asset_type">
                <option value="Station">Station de Transport</option>
                <option value="Stop">Point d'Arrêt</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Saisonnalité</label>
              <select class="form-control" [(ngModel)]="formData.season">
                <option value="Spring">Printemps</option>
                <option value="Summer">Été</option>
                <option value="Autumn">Automne</option>
                <option value="Winter">Hiver</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Diagnostic de Maintenance</label>
              <select class="form-control" [(ngModel)]="formData.maintenance_status">
                <option value="Good">État Optimal</option>
                <option value="Average">Maintenance Requise</option>
                <option value="Poor">Critique / Obsolète</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mois</label>
              <input type="number" class="form-control" [(ngModel)]="formData.month" min="1" max="12">
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%; margin-top: 1rem;" (click)="detect()" [disabled]="loading">
            <span *ngIf="loading">⏳ Audit de l'actif...</span>
            <span *ngIf="!loading">🛡️ Lancer le Diagnostic</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Rapport de Conformité</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🏢</div>
            <p>Sélectionnez un actif pour vérifier son intégrité opérationnelle.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Analyse des cycles de charge...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getIsAnomaly() ? '#ff4d6a12' : '#00e5a012'" [style.border]="getIsAnomaly() ? '2px solid #ff4d6a40' : '2px solid #00e5a040'">
              <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 0.5rem;">Statut de l'Infrastructure :</div>
              <div [style.color]="getIsAnomaly() ? '#ff4d6a' : '#00e5a0'" style="font-size:32px;font-weight:800">
                {{ getIsAnomaly() ? 'ANOMALIE DÉTECTÉE' : 'FONCTIONNEMENT NORMAL' }}
              </div>
              <div style="font-size:1rem;color:var(--c-text2); margin-top: 8px;">Indice de déviance : {{ getAnomalyScore() | number:'1.3' }}</div>
            </div>
            
            <div class="alert" [class]="getIsAnomaly() ? 'alert-error' : 'alert-success'" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">🔧 Recommandation Technique :</div>
              {{ getInfraRecommendation() }}
            </div>

            <div class="card" style="background: rgba(255,255,255,0.03); border: none; margin-top: 1rem;">
              <div class="card-body" style="padding: 1rem; font-size: 0.9rem;">
                📈 Ce diagnostic croise la consommation énergétique avec la charge de service pour détecter les fuites ou les pannes latentes.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class InfraAnomalyComponent {
  loading = false;
  result: any = null;
  formData = { 
    station_energy: 450, 
    waste_collected: 100, 
    infrastructure_id: 1, 
    hour: 14, 
    month: 6, 
    asset_type: 'Station', 
    maintenance_status: 'Good', 
    season: 'Summer' 
  };
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  detect() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/infra/anomaly/detect`, this.formData).pipe(
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

  getInfraRecommendation(): string {
    if (this.getIsAnomaly()) {
      return "Alerte : Surconsommation détectée par rapport au volume de service. Une inspection technique pour vérifier d'éventuelles fuites ou pannes de capteurs est prioritaire.";
    }
    return "Système conforme : La consommation est parfaitement alignée avec l'usage de l'infrastructure. Maintenir le plan de maintenance préventive actuel.";
  }
}