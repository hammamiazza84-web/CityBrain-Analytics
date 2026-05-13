import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-piml-e',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header"><h1 class="page-title">🎯 PIML Clustering</h1><p class="page-subtitle">Clustering K-Means + DBSCAN</p></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h2 class="card-title">Paramètres</h2><span class="badge">K-Means / DBSCAN</span></div>
        <div class="card-body">
          <div class="alert" style="background:rgba(0,194,255,.08);border:1px solid var(--c-blue);color:var(--c-text);margin-bottom:12px;padding:10px;border-radius:8px;font-size:0.85rem">
            Détecte le groupe de risque (Cluster) basé sur les données de sécurité
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Accident Count</label><input type="number" class="form-control" [(ngModel)]="formData.Accident_Count" min="0"></div>
            <div class="form-group"><label class="form-label">Crime Volume</label><input type="number" class="form-control" [(ngModel)]="formData.Crime_Volume" min="0"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Précipitations (mm)</label><input type="number" class="form-control" [(ngModel)]="formData.Precipitation_mm" step="0.1"></div>
            <div class="form-group"><label class="form-label">Safety Level</label><select class="form-control" [(ngModel)]="formData.Safety_Level"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">City</label><select class="form-control" [(ngModel)]="formData.City"><option>Paris</option><option>Lyon</option><option>Marseille</option><option>Bordeaux</option><option>Lille</option><option>Nantes</option><option>Strasbourg</option><option>Montpellier</option></select></div>
            <div class="form-group"><label class="form-label">Socio Economic Group</label><select class="form-control" [(ngModel)]="formData.Socio_Economic_Group"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Weather Conditions</label><select class="form-control" [(ngModel)]="formData.Weather_Conditions"><option>Clear</option><option>Mainly Clear</option><option>Cloudy</option><option>Rain</option><option>Other</option></select></div>
            <div class="form-group"><label class="form-label">Stop Type</label><select class="form-control" [(ngModel)]="formData.Stop_Type"><option>Standard</option></select></div>
          </div>
          <button class="btn btn-primary" style="background:linear-gradient(135deg,#00c2ff,#0077b6);width:100%;margin-top:12px" (click)="cluster()" [disabled]="loading"><span *ngIf="loading">⏳</span>{{ loading ? 'Détection...' : 'Détecter Cluster' }}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">Résultat</h2></div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2)"><p>Cliquez sur Clusteriser</p></div>
          <div *ngIf="loading" class="text-center"><div class="spinner"></div></div>
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getColor() + '12'" [style.border]="'2px solid ' + getColor() + '40'" style="text-align:center;padding:20px;border-radius:10px">
              <div style="font-size:48px;margin-bottom:8px">{{ getEmoji() }}</div>
              <div [style.color]="getColor()" style="font-size:28px;font-weight:800">{{ getClusterName() }}</div>
              <div style="font-size:14px;color:#94a3b8;margin-top:8px">Distance au centre: {{ getDistanceToCenter() | number:'1.2' }}</div>
              <div [style.background]="getColor() + '20'" [style.color]="getColor()" style="margin-top:12px;padding:8px 16px;border-radius:20px;display:inline-block;font-size:14px"><b>Niveau: {{ getRiskLevel() }}</b></div>
            </div>
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
export class PimlEComponent {
  loading = false;
  result: any = null;
  formData = { Accident_Count: 4, Crime_Volume: 6, Precipitation_mm: 3.0, Safety_Level: 'Medium', City: 'Paris', Socio_Economic_Group: 'Medium', Weather_Conditions: 'Clear', Stop_Type: 'Standard' };
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  cluster() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/piml/e/predict`, this.formData).pipe(
      catchError(err => { this.loading = false; this.cdr.markForCheck(); return throwError(() => err); })
    ).subscribe({
      next: (data: any) => { this.result = data; this.loading = false; this.cdr.markForCheck(); }
    });
  }
  getCluster(): number {
    if (!this.result) return 0;
    return this.result.cluster ?? 0;
  }
  getClusterName(): string {
    if (!this.result) return '';
    return this.result.cluster_name ?? '';
  }
  getRiskLevel(): string {
    if (!this.result) return '';
    return this.result.risk_level ?? '';
  }
  getRiskScore(): number {
    if (!this.result) return 0;
    return this.result.risk_score ?? 0;
  }
  getEmoji(): string {
    const cluster = this.getCluster();
    if (cluster === 0) return '🟢';
    if (cluster === 1) return '🟡';
    return '🔴';
  }
  getColor(): string {
    return this.result?.color ?? '#00c2ff';
  }
  getDistanceToCenter(): number {
    if (!this.result) return 0;
    return this.result.distance_to_center ?? 0;
  }
}