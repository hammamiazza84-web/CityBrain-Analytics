import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError, forkJoin, of } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-client-transport',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
      <div class="page-header">
        <h1>🚌 Prédiction du Retard</h1>
        <p>Savoir quand votre transport arrivera</p>
      </div>
      
      <div class="evaluation-card">
        <div class="card-header">
          <h2>Paramètres du trajet</h2>
        </div>
        
        <div class="form-grid">
          <!-- Première ligne : Temps -->
          <div class="form-row">
            <div class="form-group">
              <label>🕒 Heure (0-23)</label>
              <input type="number" [(ngModel)]="formData.hour" min="0" max="23">
            </div>
            <div class="form-group">
              <label>📅 Jour (0=Lun)</label>
              <input type="number" [(ngModel)]="formData.day_of_week" min="0" max="6">
            </div>
            <div class="form-group">
              <label>📆 Mois (1-12)</label>
              <input type="number" [(ngModel)]="formData.month" min="1" max="12">
            </div>
          </div>
          
          <!-- Deuxième ligne : Véhicule et Pointe -->
          <div class="form-row">
            <div class="form-group">
              <label>🚌 Véhicule</label>
              <select [(ngModel)]="formData.vehicle_id">
                <option *ngFor="let v of vehicles" [ngValue]="v.Vehicle_ID">{{ v.Vehicle_Model }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>⚡ Heure de pointe</label>
              <select [(ngModel)]="formData.is_peak">
                <option [value]="1">Oui (7-9h, 17-19h)</option>
                <option [value]="0" selected>Non</option>
              </select>
            </div>
          </div>

          <!-- Troisième ligne : Station (EN BAS) -->
          <div class="form-row">
            <div class="form-group full-width">
              <label>📍 Station (Arrêt de destination)</label>
              <select [(ngModel)]="formData.stop_id">
                <option *ngFor="let s of stops" [ngValue]="s.Stop_ID">{{ s.Stop_Name }}</option>
              </select>
            </div>
          </div>
        </div>
        
        <button class="btn-evaluate" (click)="predict()" [disabled]="loading">
          <span *ngIf="loading">⏳ Analyse...</span>
          <span *ngIf="!loading">🚌 Prédire le Retard</span>
        </button>
      </div>
      
      <div class="result-card" *ngIf="result">
        <div class="delay-result" [class]="getDelayClass()">
          <div class="result-icon">{{ getIcon() }}</div>
          <div class="result-info">
            <div class="result-title">{{ result.status }}</div>
            <div class="result-value" [style.color]="result.color">
              {{ result.pred }} sec ({{ result.pred_min }} min)
            </div>
            <div class="result-meta">
              Fiabilité: {{ (result.reliability * 100).toFixed(1) }}% · 
              {{ result.is_peak ? 'Heure de pointe' : 'Hors pointe' }}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: [`
    .client-page.with-bg {
      min-height: calc(100vh - 64px);
      position: relative;
      overflow: hidden;
    }
    .page-bg {
      position: fixed;
      top: 64px; left: 0; right: 0; bottom: 0;
      background: url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1600&q=80') center/cover no-repeat;
      filter: brightness(var(--bg-brightness, 0.25)) saturate(1.1);
      z-index: 0;
    }
    .page-overlay {
      position: fixed;
      top: 64px; left: 0; right: 0; bottom: 0;
      background: var(--bg-overlay);
      z-index: 1;
    }
    .page-content {
      position: relative;
      z-index: 2;
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
      padding-bottom: 20rem; /* Espace suffisant pour que le menu s'ouvre vers le bas */
    }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: var(--c-text); margin-bottom: 0.5rem; }
    .page-header p { color: var(--c-text2); }
    
    .evaluation-card {
      background: var(--card);
      backdrop-filter: blur(12px);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 2rem;
      transition: transform 0.3s ease, border-color 0.3s ease;
    }
    .evaluation-card:hover {
      border-color: rgba(157, 110, 255, 0.3);
    }
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .card-header h2 { 
      font-size: 1.4rem; 
      font-weight: 700; 
      color: var(--c-text); 
      letter-spacing: -0.5px;
    }
    .badge {
      padding: 6px 12px;
      background: rgba(157, 110, 255, 0.15);
      color: #9d6eff;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
    }
    
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    
    .form-row .form-group {
      flex: 1;
      min-width: 150px;
    }
    
    .form-row .form-group.full-width {
      flex: 1 1 100%;
      min-width: 100%;
    }
    
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .form-group label {
      font-size: 0.8rem;
      color: var(--c-text2);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .form-group input, .form-group select {
      padding: 10px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--c-text);
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #9d6eff;
      background: var(--bg);
      box-shadow: 0 0 0 3px rgba(157, 110, 255, 0.1);
    }
    
    .form-group select:hover {
      border-color: rgba(157, 110, 255, 0.5);
    }
    
    .form-group select option {
      background: var(--bg2);
      color: var(--c-text);
      padding: 8px 12px;
      border: none;
    }
    
    .btn-evaluate {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #9d6eff, #7c3aed);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-evaluate:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(157, 110, 255, 0.35);
    }
    .btn-evaluate:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .result-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      animation: fadeIn 0.4s ease;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(16px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .delay-result {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      padding: 1.5rem;
      border-radius: 12px;
    }
    .delay-result.ontime { background: rgba(0, 229, 160, 0.1); border: 1px solid rgba(0, 229, 160, 0.3); }
    .delay-result.warning { background: rgba(255, 152, 0, 0.1); border: 1px solid rgba(255, 152, 0, 0.3); }
    .delay-result.delayed { background: rgba(255, 77, 106, 0.1); border: 1px solid rgba(255, 77, 106, 0.3); }
    .delay-result.critical { background: rgba(156, 39, 176, 0.1); border: 1px solid rgba(156, 39, 176, 0.3); }
    
    .result-icon { font-size: 3rem; }
    .result-title { font-size: 1.2rem; font-weight: 600; color: var(--c-text); margin-bottom: 4px; }
    .result-value { font-size: 1.5rem; font-weight: 700; }
    .result-meta { font-size: 0.85rem; color: var(--c-text2); margin-top: 8px; }
  `]
})
export class ClientTransportComponent implements OnInit {
  loading = false;
  result: any = null;
  vehicles: any[] = [];
  stops: any[] = [];
  
  formData = {
    hour: 14,
    day_of_week: 1,
    month: 6,
    vehicle_id: 101,
    stop_id: 50,
    is_peak: 0
  };
  
  private apiUrl = environment.apiUrl;
  
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private apiService: ApiService) {}

  ngOnInit(): void {
    forkJoin({
      stops: this.apiService.getStops().pipe(catchError(() => of([]))),
      vehicles: this.apiService.getVehicles().pipe(catchError(() => of([])))
    }).subscribe(res => {
      if (res.stops?.length) this.stops = res.stops;
      else this.stops = [{ Stop_ID: 50, Stop_Name: 'Arrêt Paris 1' }, { Stop_ID: 51, Stop_Name: 'Arrêt Paris 2' }];
      
      if (res.vehicles?.length) this.vehicles = res.vehicles;
      else this.vehicles = [{ Vehicle_ID: 101, Vehicle_Model: 'voiture', Vehicle_Code: 'V00058' }];
      
      // Default to first item if exists
      if (this.stops.length > 0) this.formData.stop_id = this.stops[0].Stop_ID;
      if (this.vehicles.length > 0) this.formData.vehicle_id = this.vehicles[0].Vehicle_ID;
      
      this.cdr.markForCheck();
    });
  }
  
  predict(): void {
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
  
  getDelayClass(): string {
    const pred = this.result?.pred || 0;
    if (pred <= 0) return 'ontime';
    if (pred <= 120) return 'warning';
    if (pred <= 300) return 'delayed';
    return 'critical';
  }
  
  getIcon(): string {
    const pred = this.result?.pred || 0;
    if (pred <= 0) return '✅';
    if (pred <= 120) return '⚠️';
    if (pred <= 300) return '🔴';
    return '🚨';
  }
}