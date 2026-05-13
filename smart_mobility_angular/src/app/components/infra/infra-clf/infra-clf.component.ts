import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-infra-clf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🏗️ Maintenance Prédictive</h1>
      <p class="page-subtitle">Optimisation des cycles d'entretien des infrastructures urbaines</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">État des Actifs & Paramètres</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Consommation Énergétique (kWh)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.station_energy" step="0.1">
            </div>
            <div class="form-group">
              <label class="form-label">Charge de Déchets (kg)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.waste_collected" step="0.1">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Type d'équipement</label>
              <select class="form-control" [(ngModel)]="formData.asset_type">
                <option value="BAYARD">Borne Fontaine BAYARD</option>
                <option value="underground">Système Souterrain</option>
                <option value="WALLACE">Fontaine WALLACE</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Fenêtre Horaire</label>
              <input type="number" class="form-control" [(ngModel)]="formData.hour" min="0" max="23">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mois</label>
              <select class="form-control" [(ngModel)]="formData.month">
                <option *ngFor="let m of months" [value]="m">{{ m }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Journée d'analyse</label>
              <select class="form-control" [(ngModel)]="formData.day">
                <option *ngFor="let d of days" [value]="d">{{ d }}</option>
              </select>
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%" (click)="predict()" [disabled]="loading">
            <span *ngIf="loading">⏳ Analyse de l'état...</span>
            <span *ngIf="!loading">🏗️ Analyser l'Infrastructure</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Planification de Maintenance</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📋</div>
            <p>Saisissez les données pour obtenir le cycle d'entretien optimal.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Calcul de la période critique...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getSeasonColor() + '12'" [style.border]="'2px solid ' + getSeasonColor() + '50'">
              <div style="font-size:2.5rem;margin-bottom:6px">{{ getSeasonEmoji() }}</div>
              <div style="font-size:0.85rem; text-transform: uppercase; color: var(--c-text2);">Période de maintenance ciblée :</div>
              <div style="font-size:1.8rem;font-weight:800;color:{{ getSeasonColor() }}">{{ getFunctionalSeason(getInfraType()) }}</div>
              <div style="font-size:0.78rem;color:var(--c-text2);margin-top:4px">Indice de confiance : {{ getConfidence() }}%</div>
            </div>
            
            <div class="alert alert-success" style="margin-top: 1.5rem;">
              ✅ <strong>Statut : Prêt pour Intervention</strong><br>
              Les paramètres suggèrent une intervention programmée durant la période de {{ getFunctionalSeason(getInfraType()) }} pour maximiser la durée de vie de l'actif.
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class InfraClfComponent {
  loading = false;
  result: any = null;
  formData = { 
    station_energy: 50.0, 
    waste_collected: 30.0, 
    year: 2022, 
    hour: 14, 
    month: 'July', 
    day: 'Monday', 
    is_weekend: 'No', 
    asset_type: 'BAYARD' 
  };
  
  private apiUrl = environment.apiUrl;
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}

  predict() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/infra/classification/predict`, this.formData).pipe(
      catchError(err => { this.loading = false; this.cdr.markForCheck(); return throwError(() => err); })
    ).subscribe({
      next: (data: any) => { this.result = data; this.loading = false; this.cdr.markForCheck(); }
    });
  }

  getFunctionalSeason(season: string): string {
    const mapping: { [key: string]: string } = {
      'Autumn': 'Automne (Inter-saison)',
      'Spring': 'Printemps (Réactivation)',
      'Summer': 'Été (Haute Charge)',
      'Winter': 'Hiver (Conditions Critiques)'
    };
    return mapping[season] || season;
  }

  getInfraType(): string {
    if (!this.result) return '';
    return this.result.prediction ??
           this.result.predicted_class ??
           this.result.infrastructure_type ??
           this.result.type ?? '';
  }
  getSeasonEmoji(): string {
    const season = this.getInfraType();
    const emojis: { [key: string]: string } = { 'Autumn': '🍂', 'Spring': '🌸', 'Summer': '☀️', 'Winter': '❄️' };
    return emojis[season] || '🏷️';
  }
  getSeasonColor(): string {
    const season = this.getInfraType();
    const colors: { [key: string]: string } = { 'Autumn': '#ff8f3c', 'Spring': '#00e5a0', 'Summer': '#ffd93d', 'Winter': '#00c2ff' };
    return colors[season] || '#00c2ff';
  }
  getModel(): string {
    if (!this.result) return '';
    return this.result.model ?? '';
  }
  getConfidence(): string {
    if (!this.result) return '';
    const conf = this.result.confidence ?? 0;
    return (conf * 100).toFixed(1);
  }
}