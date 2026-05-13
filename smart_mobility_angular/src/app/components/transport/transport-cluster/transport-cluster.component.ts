import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-transport-cluster',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🔵 Segmentation des Flux de Mobilité</h1>
      <p class="page-subtitle">Identification automatique de profils types de trajets pour optimiser l'offre de transport</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Paramètres de l'Analyse Cohorte</h2>
        </div>
        <div class="card-body">
          <div class="info-box">
            La segmentation regroupe les trajets présentant des caractéristiques similaires (horaires, charge, ponctualité).
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type de Profilage souhaité</label>
              <select class="form-control" [(ngModel)]="formData.algo">
                <option value="K-Means">Profilage Standard (Vitesse)</option>
                <option value="DBSCAN">Détection de Micro-Segments</option>
                <option value="Agglomerative">Hiérarchie Territoriale</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Grain de Segmentation (2-10)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.k" min="2" max="10">
            </div>
          </div>
          
          <div class="form-row" *ngIf="formData.algo === 'DBSCAN'">
            <div class="form-group">
              <label class="form-label">Sensibilité de détection</label>
              <input type="number" class="form-control" [(ngModel)]="formData.eps" min="0.1" max="2.0" step="0.1">
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%; margin-top: 1rem;" (click)="cluster()" [disabled]="loading">
            <span *ngIf="loading">⏳ Analyse des cohortes...</span>
            <span *ngIf="!loading">🔵 Générer les Segments de Flux</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Typologie des Flux Identifiée</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">👥</div>
            <p>Lancez l'analyse pour découvrir les profils de mobilité dominants.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Calcul des centres de gravité de flux...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" style="background:rgba(157,110,255,0.1); border:2px solid rgba(157,110,255,0.4)">
              <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 0.5rem;">Groupes de comportements détectés :</div>
              <div style="font-size:42px;font-weight:800;color:#9d6eff">{{ getClusterCount() }}</div>
              <div style="font-size:1.1rem; font-weight: 600; margin-top: 8px;">Segments Distincts</div>
            </div>
            
            <div class="alert alert-success" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">📊 Insight Stratégique :</div>
              L'analyse a permis d'isoler {{ getClusterCount() }} profils de trajets uniques. Cette segmentation permet de personnaliser l'offre de service selon les besoins spécifiques de chaque cohorte d'usagers.
            </div>

            <div class="card" style="background: rgba(255,255,255,0.03); border: none; margin-top: 1rem;">
              <div class="card-body" style="padding: 1rem; font-size: 0.9rem;">
                💡 <strong>Cas d'usage :</strong> Utilisez ces segments pour optimiser le cadencement des rames durant les périodes identifiées comme homogènes.
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
export class TransportClusterComponent {
  loading = false;
  result: any = null;
  formData = { algo: 'K-Means', k: 4, eps: 0.8 };
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  cluster() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/transport/cluster`, this.formData).pipe(
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

  getClusterCount(): number {
    if (!this.result) return 0;
    return this.result.metrics?.n_clusters ??
           this.result.n_clusters ??
           (this.result.labels?.length) ??
           (this.result.clusters?.length) ??
           this.result.cluster_count ?? 0;
  }
}