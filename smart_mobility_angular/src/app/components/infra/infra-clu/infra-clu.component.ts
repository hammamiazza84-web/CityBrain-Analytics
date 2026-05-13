import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-infra-clu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header"><h1 class="page-title">🔵 Infra Clustering Zones</h1><p class="page-subtitle">Regroupement des zones d'infrastructure</p></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h2 class="card-title">Paramètres</h2><span class="badge">K-Means</span></div>
        <div class="card-body">
          <div class="alert" style="background:rgba(0,194,255,.08);border:1px solid var(--c-blue);color:var(--c-text);margin-bottom:12px;padding:10px;border-radius:8px;font-size:0.85rem">
            Clustering des zones d'infrastructure · K-Means
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Energy Mean (kWh)</label><input type="number" class="form-control" [(ngModel)]="formData.energy_mean" step="0.1"></div>
            <div class="form-group"><label class="form-label">Waste Mean (kg)</label><input type="number" class="form-control" [(ngModel)]="formData.waste_mean" step="0.1"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Hour Mean</label><input type="number" class="form-control" [(ngModel)]="formData.hour_mean" min="0" max="23"></div>
            <div class="form-group"><label class="form-label">Fact Count</label><input type="number" class="form-control" [(ngModel)]="formData.fact_count" min="1"></div>
          </div>
          <button class="btn btn-primary" style="background:linear-gradient(135deg,#7c3aed,#9d6eff);width:100%" (click)="cluster()" [disabled]="loading"><span *ngIf="loading">⏳</span>{{ loading ? 'Clustering...' : '🔵 Clusteriser Zones' }}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">Résultat</h2></div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2)"><p>Cliquez sur Clusteriser</p></div>
          <div *ngIf="loading" class="text-center"><div class="spinner"></div></div>
          <div *ngIf="result && !loading">
            <div class="result-header" style="background:#7c3aed20;border:2px solid #7c3aed50">
              <div style="font-size:2rem;font-weight:800;color:#7c3aed">{{ getClusterCount() }}</div>
              <div style="font-size:1rem;color:var(--c-text2)">{{ getClusterLabel() || 'Zones regroupées' }}</div>
            </div>
            <div class="alert alert-success">✅ Clustering des zones réussi</div>
            <div style="margin-top:8px;font-size:0.85rem;color:var(--c-text2)">Silhouette: {{ getSilhouette() | number:'1.3' }}</div>
            <div *ngIf="result" style="margin-top:0.5rem;font-size:0.7rem;color:var(--c-text2)">
              <details><summary>Debug API</summary><pre>{{ result | json }}</pre></details>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class InfraCluComponent {
  loading = false;
  result: any = null;
  formData = { energy_mean: 50.0, waste_mean: 30.0, hour_mean: 14, fact_count: 1 };
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  cluster() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/infra/clustering/predict`, this.formData).pipe(
      catchError(err => { this.loading = false; this.cdr.markForCheck(); return throwError(() => err); })
    ).subscribe({
      next: (data: any) => { this.result = data; this.loading = false; this.cdr.markForCheck(); }
    });
  }
  getClusterCount(): number {
    if (!this.result) return 0;
    return this.result.cluster ??
           this.result.total_clusters ??
           this.result.n_clusters ?? 0;
  }
  getClusterLabel(): string {
    if (!this.result) return '';
    return this.result.cluster_label ?? '';
  }
  getSilhouette(): number {
    if (!this.result) return 0;
    return this.result.silhouette ?? 0;
  }
}