import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-transport-ts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">📅 Planification Stratégique des Flux</h1>
      <p class="page-subtitle">Modélisation prévisionnelle des tendances de mobilité pour la planification à long terme</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Configuration du Modèle Prévisionnel</h2>
        </div>
        <div class="card-body">
          <div class="info-box">
            Cette analyse projette les retards futurs en se basant sur la saisonnalité et les cycles historiques du réseau.
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Profondeur de l'Analyse Historique</label>
              <select class="form-control" [(ngModel)]="formData.p">
                <option [value]="1">Standard (1 cycle)</option>
                <option [value]="2">Approfondie (2 cycles)</option>
                <option [value]="3">Maximale (3 cycles)</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Mode de Projection</label>
              <select class="form-control" [(ngModel)]="formData.use_sarima">
                <option [value]="true">Prise en compte de la Saisonnalité</option>
                <option [value]="false">Projection Linéaire simple</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Correction des Tendances</label>
              <input type="number" class="form-control" [(ngModel)]="formData.d" min="0" max="2">
            </div>
            <div class="form-group">
              <label class="form-label">Lissage des Fluctuations</label>
              <input type="number" class="form-control" [(ngModel)]="formData.q" min="0" max="5">
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%; margin-top: 1rem;" (click)="predict()" [disabled]="loading">
            <span *ngIf="loading">⏳ Modélisation des tendances...</span>
            <span *ngIf="!loading">📅 Générer les Prévisions</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Perspectives de Ponctualité</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
            <p>Le moteur de planification est prêt pour une projection temporelle.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Calcul des corrélations saisonnières...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" style="background:rgba(0,229,160,0.1); border:2px solid rgba(0,229,160,0.4)">
              <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 0.5rem;">Statut de la Projection :</div>
              <div style="font-size:28px;font-weight:800;color:#00e5a0">MODÉLISATION TERMINÉE</div>
              <div style="font-size:1rem;color:var(--c-text2); margin-top: 8px;">Fiabilité du modèle : Optimale</div>
            </div>
            
            <div class="alert alert-warning" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">🕒 Points de Vigilance Temporels :</div>
              La période la plus critique est identifiée à <strong>{{ getWorstHour() }}</strong> avec un retard moyen projeté de <strong>{{ getWorstValue() }}s</strong>.
              <br><br>
              L'intervalle de fluidité maximale est prévu à <strong>{{ getBestHour() }}</strong>.
            </div>

            <div style="margin-top:1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="card" style="background: rgba(255,255,255,0.03); border: none;">
                <div class="card-body" style="padding: 1rem; text-align: center;">
                  <div style="font-size: 0.75rem; color: #8ba3c7; margin-bottom: 0.5rem;">Moyenne Heures de Pointe</div>
                  <div style="font-size: 1.5rem; font-weight: 800; color: #ff8f3c;">{{ getPeakAvg() }}s</div>
                </div>
              </div>
              <div class="card" style="background: rgba(255,255,255,0.03); border: none;">
                <div class="card-body" style="padding: 1rem; text-align: center;">
                  <div style="font-size: 0.75rem; color: #8ba3c7; margin-bottom: 0.5rem;">Moyenne Heures Creuses</div>
                  <div style="font-size: 1.5rem; font-weight: 800; color: #00e5a0;">{{ getOffAvg() }}s</div>
                </div>
              </div>
            </div>

            <div class="alert alert-success" style="margin-top: 1rem; font-size: 0.9rem;">
              💡 <strong>Action recommandée :</strong> Ajustez les plannings de maintenance pour qu'ils coïncident avec les périodes de fluidité maximale ({{ getBestHour() }}).
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
export class TransportTsComponent {
  loading = false;
  result: any = null;
  formData = { p: 1, d: 1, q: 1, use_sarima: true };
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  predict() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/transport/timeseries`, this.formData).pipe(
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

  getWorstHour(): string {
    if (!this.result?.insights) return 'N/A';
    return `${this.result.insights.worst_h}h`;
  }
  
  getWorstValue(): number {
    if (!this.result?.insights) return 0;
    return Math.round(this.result.insights.worst_val);
  }
  
  getBestHour(): string {
    if (!this.result?.insights) return 'N/A';
    return `${this.result.insights.best_h}h`;
  }
  
  getBestValue(): number {
    if (!this.result?.insights) return 0;
    return Math.round(this.result.insights.best_val);
  }
  
  getPeakAvg(): number {
    if (!this.result?.insights) return 0;
    return Math.round(this.result.insights.peak_avg);
  }
  
  getOffAvg(): number {
    if (!this.result?.insights) return 0;
    return Math.round(this.result.insights.off_avg);
  }
}