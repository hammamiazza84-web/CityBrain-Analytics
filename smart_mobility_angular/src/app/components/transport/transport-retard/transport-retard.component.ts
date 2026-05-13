import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-transport-retard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🚌 Pilotage de la Ponctualité</h1>
      <p class="page-subtitle">Anticipation des retards pour optimiser la régulation du trafic</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Paramètres Opérationnels</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Heure de passage prévue</label>
              <input type="number" class="form-control" [(ngModel)]="formData.hour" min="0" max="23">
            </div>
            <div class="form-group">
              <label class="form-label">Journée</label>
              <select class="form-control" [(ngModel)]="formData.day_of_week">
                <option [value]="0">Lundi</option>
                <option [value]="1">Mardi</option>
                <option [value]="2">Mercredi</option>
                <option [value]="3">Jeudi</option>
                <option [value]="4">Vendredi</option>
                <option [value]="5">Samedi</option>
                <option [value]="6">Dimanche</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Taux d'occupation estimé (%)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.charge" min="0" max="100">
            </div>
            <div class="form-group">
              <label class="form-label">Identifiant Ligne / Véhicule</label>
              <input type="number" class="form-control" [(ngModel)]="formData.vehicle_id" min="1">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Zone de circulation (ID)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.segment_id" min="1">
            </div>
            <div class="form-group">
              <label class="form-label">Période d'affluence</label>
              <select class="form-control" [(ngModel)]="formData.is_peak">
                <option [value]="1">Heures de pointe</option>
                <option [value]="0">Heures creuses</option>
              </select>
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%" (click)="predict()" [disabled]="loading">
            <span *ngIf="loading">⏳ Calcul de la fluidité...</span>
            <span *ngIf="!loading">📋 Analyser la Ponctualité</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Diagnostic de Circulation</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">⏱️</div>
            <p>Configurez la ligne pour simuler les conditions de trafic.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Analyse des segments de trafic...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getDelayColor(getDelayValue()) + '12'" [style.border]="'2px solid ' + getDelayColor(getDelayValue()) + '50'">
              <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 0.5rem;">Retard estimé à l'arrivée :</div>
              <div [style.color]="getDelayColor(getDelayValue())" style="font-size:42px;font-weight:800">{{ getDelayValue() | number:'1.0-0' }} <span style="font-size:20px">min</span></div>
              <div style="font-size:1rem;font-weight: 600; margin-top: 8px;">{{ getManagerStatus() }}</div>
            </div>
            
            <div class="alert" [class]="getAlertClass()" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Recommandation de Régulation :</div>
              {{ getDelayRecommendation() }}
            </div>

            <div class="card" style="background: rgba(255,255,255,0.03); border: none; margin-top: 1rem;">
              <div class="card-body" style="padding: 1rem; font-size: 0.9rem;">
                ℹ️ Ce diagnostic permet d'anticiper les ruptures de charge et d'ajuster les fréquences de passage en temps réel.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TransportRetardComponent {
  loading = false;
  result: any = null;
  formData = { 
    hour: 14, 
    day_of_week: 1, 
    month: 6, 
    vehicle_id: 101, 
    stop_id: 50, 
    segment_id: 10, 
    charge: 40, 
    is_peak: 0 
  };
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  predict() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/transport/manual_predict`, this.formData).pipe(
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

  getDelayValue(): number {
    if (!this.result) return 0;
    return this.result.pred ?? 
           this.result.predicted_delay ?? 
           this.result.prediction ?? 
           this.result.delay ?? 
           this.result.value ?? 0;
  }

  getDelayColor(delay: number): string { 
    if (delay > 15) return '#ff4d6a';
    if (delay > 5) return '#ff8f3c';
    return '#00e5a0'; 
  }

  getManagerStatus(): string {
    const delay = this.getDelayValue();
    if (delay > 15) return 'Perturbation Majeure';
    if (delay > 5) return 'Ralentissement Modéré';
    return 'Service Fluide';
  }

  getAlertClass(): string {
    const delay = this.getDelayValue();
    if (delay > 15) return 'alert-error';
    if (delay > 5) return 'alert-warning';
    return 'alert-success';
  }

  getDelayRecommendation(): string {
    const delay = this.getDelayValue();
    if (delay > 15) return 'Alerte : Déploiement immédiat de navettes de substitution recommandé. Informer les usagers via les écrans en station.';
    if (delay > 5) return 'Attention : Légère dérive de ponctualité. Surveiller le segment et envisager un ajustement de la vitesse commerciale.';
    return 'Conditions nominales. Aucun ajustement opérationnel requis pour le moment.';
  }
}