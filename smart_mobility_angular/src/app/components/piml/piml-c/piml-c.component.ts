import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-piml-c',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🛡️ Audit de Sécurité & Risques</h1>
      <p class="page-subtitle">Évaluation de la vulnérabilité et aide à la décision pour la protection urbaine</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Données de Sécurité</h2>
        </div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Fréquence des Incidents (Accidents)</label>
              <input type="number" class="form-control" [(ngModel)]="formData.Accident_Count" min="0">
            </div>
            <div class="form-group">
              <label class="form-label">Indice de Criminalité</label>
              <input type="number" class="form-control" [(ngModel)]="formData.Crime_Volume" min="0">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Zone Géographique</label>
              <select class="form-control" [(ngModel)]="formData.City">
                <option>Paris</option>
                <option>Lyon</option>
                <option>Marseille</option>
                <option>Bordeaux</option>
                <option>Lille</option>
                <option>Nantes</option>
                <option>Strasbourg</option>
                <option>Montpellier</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Niveau de Vigilance Actuel</label>
              <select class="form-control" [(ngModel)]="formData.Safety_Level">
                <option value="High">Haut</option>
                <option value="Medium">Modéré</option>
                <option value="Low">Faible</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Mois</label>
              <select class="form-control" [(ngModel)]="formData.Month_Name">
                <option *ngFor="let m of months" [value]="m">{{ m }}</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Type d'Infrastructure</label>
              <select class="form-control" [(ngModel)]="formData.Stop_Type">
                <option value="Standard">Standard</option>
                <option value="Hub">Pôle d'Échange</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Contexte Socio-Économique</label>
              <select class="form-control" [(ngModel)]="formData.Socio_Economic_Group">
                <option value="High">Zone Tertiaire / Luxe</option>
                <option value="Medium">Mixte / Résidentiel</option>
                <option value="Low">Périurbain / Sensible</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Conditions Météo</label>
              <select class="form-control" [(ngModel)]="formData.Weather_Conditions">
                <option value="Clear">Dégagé</option>
                <option value="Cloudy">Couvert</option>
                <option value="Rain">Pluie / Orage</option>
              </select>
            </div>
          </div>
          
          <button class="btn btn-primary" style="width:100%;margin-top:12px" (click)="predict()" [disabled]="loading">
            <span *ngIf="loading">⏳ Audit en cours...</span>
            <span *ngIf="!loading">🛡️ Évaluer la Vulnérabilité</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Score de Vulnérabilité</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🛡️</div>
            <p>Lancez l'audit pour évaluer le niveau de risque de la zone.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Analyse des facteurs de risque...</p>
          </div>
          
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getColor() + '12'" [style.border]="'2px solid ' + getColor() + '40'">
              <div style="font-size:2.5rem;margin-bottom:6px">{{ getEmoji() }}</div>
              <div style="font-size:0.85rem; text-transform: uppercase; color: var(--c-text2);">Niveau de Sûreté :</div>
              <div style="font-size:1.5rem;font-weight:700;color:{{ getColor() }}">{{ getManagerSeverity() }}</div>
              <div style="font-size:.78rem;color:var(--c-text2);margin-top:4px">Fiabilité de l'audit : {{ getConfidence() }}%</div>
            </div>
            
            <div style="margin-top:1.5rem">
              <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 1rem;">Décomposition du Risque</h4>
              <div *ngFor="let prob of getProbabilities()" style="margin-bottom: 1rem;">
                <div style="display:flex;justify-content:space-between;margin-bottom:0.4rem;font-size:0.85rem">
                  <span>{{ getManagerLabel(prob.label) }}</span>
                  <span>{{ prob.value }}%</span>
                </div>
                <div style="height:8px;background:rgba(255,255,255,0.05);border-radius:4px;overflow:hidden">
                  <div [style.width.%]="prob.value" [style.background]="prob.color" style="height:100%"></div>
                </div>
              </div>
            </div>
            
            <div class="alert" [class]="getAlertClass()" style="margin-top:1.5rem; padding: 1.25rem;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Recommandation de Sécurité :</div>
              {{ getSecurityRecommendation() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PimlCComponent {
  loading = false;
  result: any = null;
  formData = { 
    Accident_Count: 3, 
    Crime_Volume: 5, 
    Precipitation_mm: 2.5, 
    City: 'Paris', 
    Safety_Level: 'Medium', 
    Weather_Conditions: 'Clear', 
    Month_Name: 'January', 
    Hour_Interval: '08:00 - 09:00', 
    Is_Weekend: 'No', 
    Peak_Status: 'Off-Peak', 
    Socio_Economic_Group: 'Medium', 
    Stop_Type: 'Standard' 
  };
  
  months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  predict() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/piml/c/predict`, this.formData).pipe(
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

  getManagerSeverity(): string {
    const s = this.getSeverity();
    if (s === 'Critique' || s === 'High') return 'Vigilance Critique';
    if (s === 'Élevé' || s === 'Medium') return 'Attention Requise';
    return 'Sûreté Optimale';
  }

  getManagerLabel(label: string): string {
    if (label === 'High' || label === 'Critique') return 'Risque Majeur';
    if (label === 'Medium' || label === 'Élevé') return 'Risque Modéré';
    return 'Risque Faible';
  }

  getSeverity(): string {
    if (!this.result) return '';
    return this.result.severity ?? this.result.prediction ?? '';
  }

  getAlertClass(): string {
    const s = this.getSeverity();
    if (s === 'Critique' || s === 'High') return 'alert-error';
    if (s === 'Élevé' || s === 'Medium') return 'alert-warning';
    return 'alert-success';
  }

  getColor(): string {
    const s = this.getSeverity();
    if (s === 'Critique' || s === 'High') return '#ff4d6a';
    if (s === 'Élevé' || s === 'Medium') return '#ff8f3c';
    return '#00e5a0';
  }

  getEmoji(): string {
    const s = this.getSeverity();
    if (s === 'Critique' || s === 'High') return '🚨';
    if (s === 'Élevé' || s === 'Medium') return '⚠️';
    return '✅';
  }

  getConfidence(): string {
    if (!this.result) return '';
    const conf = this.result.confidence ?? 0;
    return (conf * 100).toFixed(1);
  }

  getProbabilities(): any[] {
    if (!this.result?.probabilities) return [];
    const currentSev = this.getSeverity();
    return Object.entries(this.result.probabilities).map(([k, v]) => ({
      label: k,
      value: Math.round(v as number * 100) > 100 ? Math.round(v as number) : Math.round(v as number * 100),
      color: k === currentSev ? this.getColor() : 'rgba(255,255,255,0.1)'
    }));
  }

  getSecurityRecommendation(): string {
    const s = this.getSeverity();
    if (s === 'Critique' || s === 'High') return 'Alerte : Niveau de vulnérabilité élevé. Renforcement immédiat des patrouilles et activation de la surveillance augmentée recommandé.';
    if (s === 'Élevé' || s === 'Medium') return 'Vigilance : Risque de perturbation identifié. Surveillance accrue des points sensibles de la zone.';
    return 'Statut : Conditions de sécurité nominales. Aucune mesure exceptionnelle requise.';
  }
}