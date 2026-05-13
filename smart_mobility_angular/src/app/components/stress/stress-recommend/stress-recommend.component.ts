import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-stress-recommend',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">💡 Recommandation Faible Stress</h1>
      <p class="page-subtitle">Suggérer les meilleurs créneaux et itinéraires</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Critères de recommandation</h2>
          <span class="badge">Matrix Analysis</span>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Ville</label>
              <select class="form-control" [(ngModel)]="formData.city">
                <option *ngFor="let city of cities" [value]="city">{{ city }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Catégorie Usager</label>
              <select class="form-control" [(ngModel)]="formData.user_category">
                <option>metro</option>
                <option>bus</option>
                <option>tram</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Profil Mobilité</label>
              <select class="form-control" [(ngModel)]="formData.mobility_profile">
                <option>Low Stress</option>
                <option>High Stress</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nb Recommandations</label>
              <input type="number" class="form-control" [(ngModel)]="formData.top_n" min="1" max="10">
            </div>
          </div>
          
          <button class="btn" style="background: linear-gradient(135deg, #00c2ff, #1565C0);" (click)="getRecommendations()" [disabled]="loading">
            <span *ngIf="loading">⏳</span>
            <span *ngIf="!loading">💡</span>
            {{ loading ? 'Analyse...' : 'Recommander Créneaux' }}
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Résultat</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="result-container">
            <p style="color: var(--c-text2); text-align: center;">Sélectionnez vos critères et lancez la recherche</p>
          </div>
          
          <div *ngIf="loading" class="text-center">
            <div class="spinner"></div>
            <p style="color: var(--c-text2); margin-top: 1rem;">Analyse de la matrice...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div style="text-align: center; padding: 1rem; background: rgba(0, 194, 255, 0.1); border: 2px solid var(--c-blue); border-radius: 10px; margin-bottom: 1rem;">
              <div style="font-size: 1.5rem; font-weight: 700; color: var(--c-accent);">{{ getBestStress()?.toFixed(2) }}</div>
              <div style="font-size: 0.8rem; color: var(--c-text2);">Meilleur stress trouvé (global: {{ getGlobalAvgStress()?.toFixed(2) }})</div>
              <div style="font-size: 0.9rem; color: #4CAF50; margin-top: 0.25rem;">↓ {{ getStressReduction() }} de réduction</div>
            </div>
            
            <div style="font-size: 0.75rem; font-weight: 700; color: var(--c-text2); text-transform: uppercase; margin-bottom: 0.5rem;">
              Top {{ getNRecommendations() }} recommandations
            </div>
            
            <div class="recommendation-item" *ngFor="let rec of getRecommendationsList(); let i = index">
              <div class="recommendation-header">
                <span class="recommendation-title">#{{ i + 1 }} {{ rec.City || rec.city || 'N/A' }}</span>
                <span class="recommendation-stress">{{ (rec.Avg_Stress ?? rec.avg_stress ?? rec.stress)?.toFixed(2) || '?' }} stress</span>
              </div>
              <div class="recommendation-meta">
                {{ rec.User_Category || rec.user_category || 'N/A' }} · {{ rec.Mobility_Profile || rec.mobility_profile || 'N/A' }} · {{ rec.N_Records ?? rec.n_records ?? rec.records ?? 0 }} records
              </div>
            </div>
            <div *ngIf="result" style="margin-top:0.5rem;font-size:0.7rem;color:var(--c-text2)">
              <details><summary>Debug API</summary><pre>{{ result | json }}</pre></details>
            </div>
          </div>
          
          <div *ngIf="error" class="alert alert-error">
            ❌ {{ error }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class StressRecommendComponent {
  loading = false;
  result: any = null;
  error: string | null = null;
  
  cities = ['Paris', 'Lyon', 'Marseille'];
  
  formData = {
    city: 'Paris',
    user_category: 'metro',
    mobility_profile: 'Low Stress',
    top_n: 5
  };
  
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) { }
  
  getRecommendations(): void {
    this.loading = true;
    this.error = null;
    this.result = null;
    this.cdr.markForCheck();
    
    this.apiService.getRecommendations(this.formData).subscribe({
      next: (data) => {
        this.result = data;
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
  
  getBestStress(): number | undefined {
    if (!this.result) return undefined;
    return this.result.best_stress_found ?? this.result.bestStress ?? this.result.minStress;
  }
  
  getGlobalAvgStress(): number | undefined {
    if (!this.result) return undefined;
    return this.result.global_avg_stress ?? this.result.globalAvg ?? this.result.avgStress;
  }
  
  getStressReduction(): string {
    if (!this.result) return '';
    return this.result.stress_reduction ?? this.result.reduction ?? '';
  }
  
  getNRecommendations(): number {
    if (!this.result) return 0;
    return this.result.n_recommendations ?? this.result.nRecommendations ?? this.result.count ?? 0;
  }
  
  getRecommendationsList(): any[] {
    if (!this.result) return [];
    return this.result.recommendations ?? this.result.recs ?? this.result.items ?? [];
  }
}
