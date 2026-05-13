import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-transport-clf',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🏷️ Qualification de la Fluidité</h1>
      <p class="page-subtitle">Classification automatique du niveau de service par segment de trajet</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Données d'Exploitation</h2>
        </div>
        <div class="card-body">
          <div class="info-box">
            Ce module qualifie la qualité de service (QS) attendue selon les conditions d'exploitation.
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Heure de simulation</label>
              <input type="number" class="form-control" [(ngModel)]="formData.hour" min="0" max="23">
            </div>
            <div class="form-group">
              <label class="form-label">Journée (0=Lundi)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.dow" min="0" max="6">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Période (Mois)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.month" min="1" max="12">
            </div>
            <div class="form-group">
              <label class="form-label">Occupation des rames (%)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.charge" min="0" max="100">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Code Ligne / Véhicule</label>
              <input type="number" class="form-control" [(ngModel)]="formData.vehicle_id" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Point d'Arrêt (ID)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.stop_id" min="1">
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%; margin-top: 1rem;" (click)="classify()" [disabled]="loading">
            <span *ngIf="loading">⏳ Qualification en cours...</span>
            <span *ngIf="!loading">🏷️ Qualifier le Niveau de Service</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Indicateur de Qualité de Service</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🚌</div>
            <p>Lancez la qualification pour évaluer la fluidité prévisionnelle.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Analyse des patterns de ponctualité...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getDelayColor(getDelayCategory()) + '12'" [style.border]="'2px solid ' + getDelayColor(getDelayCategory()) + '40'">
              <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 0.5rem;">Niveau de Service Estimé :</div>
              <div [style.color]="getDelayColor(getDelayCategory())" style="font-size:32px;font-weight:800">
                {{ getManagerCategory() }}
              </div>
            </div>
            
            <div class="alert" [class]="getAlertClass()" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Recommandation Qualité :</div>
              {{ getClfRecommendation() }}
            </div>

            <div class="card" style="background: rgba(255,255,255,0.03); border: none; margin-top: 1rem;">
              <div class="card-body" style="padding: 1rem; font-size: 0.9rem;">
                📈 Cette classification aide à piloter les engagements de ponctualité (SLA) envers les usagers.
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
export class TransportClfComponent {
  loading = false;
  result: any = null;
  formData = { hour: 8, dow: 1, month: 6, vehicle_id: 101, stop_id: 50, segment_id: 10, charge: 40 };
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  classify() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/transport/classify_manual`, this.formData).pipe(
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

  getDelayCategory(): string {
    if (!this.result) return '';
    return this.result.status ?? this.result.delay_category ?? this.result.category ?? '';
  }

  getManagerCategory(): string {
    const cat = this.getDelayCategory();
    if (cat === 'Faible' || cat === 'On-Time') return 'Excellent / Ponctuel';
    if (cat === 'Modéré') return 'Ralentissement Mineur';
    if (cat === 'Élevé' || cat === 'Delayed') return 'Retard Critique';
    return cat || 'Indéterminé';
  }

  getDelayColor(cat: string): string {
    if (cat === 'Faible' || cat === 'On-Time') return '#00e5a0';
    if (cat === 'Modéré') return '#ffd93d';
    return '#ff8f3c';
  }

  getAlertClass(): string {
    const cat = this.getDelayCategory();
    if (cat === 'Faible' || cat === 'On-Time') return 'alert-success';
    if (cat === 'Modéré') return 'alert-warning';
    return 'alert-error';
  }

  getClfRecommendation(): string {
    const cat = this.getDelayCategory();
    if (cat === 'Faible' || cat === 'On-Time') return "Service nominal. Aucune action de régulation requise. Maintenir les fréquences actuelles.";
    if (cat === 'Modéré') return "Vigilance : Surveillance du segment recommandée. Anticiper un possible décalage sur le prochain arrêt.";
    return "Action requise : Priorité de passage nécessaire ou injection d'un véhicule de renfort pour résorber le retard.";
  }
}