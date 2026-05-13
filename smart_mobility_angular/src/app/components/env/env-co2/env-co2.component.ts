import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-env-co2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🌿 Pilotage de l'Empreinte Carbone</h1>
      <p class="page-subtitle">Surveillance et prévision des émissions de CO2 liées au trafic</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Paramètres de Simulation</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mois de l'année</label>
              <select class="form-control" [(ngModel)]="formData.Month">
                <option [value]="1">Janvier</option>
                <option [value]="2">Février</option>
                <option [value]="3">Mars</option>
                <option [value]="4">Avril</option>
                <option [value]="5">Mai</option>
                <option [value]="6">Juin</option>
                <option [value]="7">Juillet</option>
                <option [value]="8">Août</option>
                <option [value]="9">Septembre</option>
                <option [value]="10">Octobre</option>
                <option [value]="11">Novembre</option>
                <option [value]="12">Décembre</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Tranche Horaire</label>
              <input type="number" class="form-control" [(ngModel)]="formData.Hour" min="0" max="23">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Jour de la semaine</label>
              <select class="form-control" [(ngModel)]="formData.DayOfWeek">
                <option [value]="0">Lundi</option>
                <option [value]="1">Mardi</option>
                <option [value]="2">Mercredi</option>
                <option [value]="3">Jeudi</option>
                <option [value]="4">Vendredi</option>
                <option [value]="5">Samedi</option>
                <option [value]="6">Dimanche</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Saisonnalité</label>
              <select class="form-control" [(ngModel)]="formData.Season_num">
                <option [value]="0">Hiver</option>
                <option [value]="1">Printemps</option>
                <option [value]="2">Été</option>
                <option [value]="3">Automne</option>
              </select>
            </div>
          </div>
          
          <button class="btn btn-success" style="width:100%" (click)="predict()" [disabled]="loading">
            <span *ngIf="loading">⏳ Calcul d'impact...</span>
            <span *ngIf="!loading">🌿 Calculer l'Empreinte</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Bilan Émissions Estimé</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🍃</div>
            <p>Configurez la période pour estimer l'impact environnemental.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Analyse des rejets atmosphériques...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getColor() + '12'" [style.border]="'2px solid ' + getColor() + '40'">
              <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 0.5rem;">Volume de rejets CO2 :</div>
              <div [style.color]="getColor()" style="font-family: var(--font-head); font-size: 3rem; font-weight: 800;">{{ getCO2Value() | number:'1.1-1' }} <span style="font-size: 1.5rem;">kg</span></div>
              <div style="font-size:1.1rem; font-weight: 600; margin-top: 8px;">{{ isAboveThreshold() ? 'Impact Élevé' : 'Impact Modéré' }}</div>
            </div>
            
            <div class="alert" [class]="isAboveThreshold() ? 'alert-error' : 'alert-success'" style="margin-top: 1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">📈 Recommandation Environnementale :</div>
              {{ isAboveThreshold() ? 'Alerte : Émissions critiques. Envisagez des mesures de restriction de circulation ou encouragez le report modal vers les transports décarbonés.' : 'Les émissions prévues sont conformes aux objectifs de développement durable de la ville.' }}
            </div>

            <div class="card" style="background: rgba(255,255,255,0.03); border: none; margin-top: 1rem;">
              <div class="card-body" style="padding: 1rem; font-size: 0.9rem;">
                🌍 Ce modèle aide à piloter la transition écologique en identifiant les périodes à forte intensité carbone.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class EnvCo2Component {
  loading = false;
  result: any = null;
  formData = { Month: 6, Hour: 10, DayOfWeek: 4, Season_num: 1 };
  
  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}
  
  predict() {
    this.loading = true;
    this.cdr.markForCheck();
    this.api.predictCo2(this.formData).subscribe({
      next: (data) => { 
        this.result = data; 
        this.loading = false; 
        this.cdr.markForCheck(); 
      },
      error: () => { 
        this.loading = false; 
        this.cdr.markForCheck(); 
      }
    });
  }

  getCO2Value(): number {
    if (!this.result) return 0;
    return this.result.predicted_co2_kg ??
           this.result.prediction ??
           this.result.co2 ??
           this.result.emissions ?? 0;
  }

  getColor(): string {
    if (!this.result) return '#00e5a0';
    return this.isAboveThreshold() ? '#ff4d6a' : '#00e5a0';
  }

  isAboveThreshold(): boolean {
    if (!this.result) return false;
    return this.result.above_threshold ?? this.result.aboveThreshold ?? (this.getCO2Value() > 100);
  }
}
