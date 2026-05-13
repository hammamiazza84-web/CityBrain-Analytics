import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-piml-f',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header"><h1 class="page-title">📉 PIML Time Series</h1><p class="page-subtitle">Séries temporelles ARIMA + Prophet</p></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h2 class="card-title">Paramètres</h2><span class="badge">ARIMA / Prophet</span></div>
        <div class="card-body">
          <div class="form-row">
            <div class="form-group"><label class="form-label">Jours à prédire</label><input type="number" class="form-control" [(ngModel)]="formData.days" min="1" max="30"></div>
          </div>
          <button class="btn btn-primary" (click)="predict()" [disabled]="loading"><span *ngIf="loading">⏳</span>{{ loading ? 'Prévision...' : '📉 Prévoir' }}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">Résultat</h2></div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2)"><p>Cliquez sur Prévoir</p></div>
          <div *ngIf="loading" class="text-center"><div class="spinner"></div></div>
          <div *ngIf="result && !loading">
            <div class="result-header" style="background:#00e5a020;border:2px solid #00e5a050">
              <div style="font-size:1.5rem;font-weight:800;color:#00e5a0">{{ getDaysPredicted() }} jours</div>
              <div style="font-size:0.9rem;color:var(--c-text2)">Prévision Time Series</div>
            </div>
            <div class="alert alert-success">Moyenne: {{ getMeanPrediction() | number:'1.2' }} · Max: {{ getMaxPrediction() | number:'1.2' }}</div>
            <div class="alert alert-success">✅ Time Series PIML réussi</div>
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
export class PimlFComponent {
  loading = false;
  result: any = null;
  formData = { days: 7 };
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  predict() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/piml/f/predict`, this.formData).pipe(
      catchError(err => { this.loading = false; this.cdr.markForCheck(); return throwError(() => err); })
    ).subscribe({
      next: (data: any) => { this.result = data; this.loading = false; this.cdr.markForCheck(); }
    });
  }
  getDaysPredicted(): number {
    if (!this.result) return 0;
    return this.result.days_predicted ??
           this.result.forecast?.length ?? 0;
  }
  getMeanPrediction(): number {
    if (!this.result) return 0;
    return this.result.mean_prediction ?? 0;
  }
  getMaxPrediction(): number {
    if (!this.result) return 0;
    return this.result.max_prediction ?? 0;
  }
}