import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-piml-d',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header"><h1 class="page-title">📈 PIML Régression</h1><p class="page-subtitle">Régression Ridge + Random Forest Regressor</p></div>
    <div class="grid-2">
      <div class="card">
        <div class="card-header"><h2 class="card-title">Paramètres</h2><span class="badge">Ridge / RF Reg</span></div>
        <div class="card-body">
          <div class="alert" style="background:rgba(0,194,255,.08);border:1px solid var(--c-blue);color:var(--c-text);margin-bottom:12px;padding:10px;border-radius:8px;font-size:0.85rem">
            Prédit le nombre d'accidents (Accident_Count) basé sur les données de sécurité
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Crime Volume</label><input type="number" class="form-control" [(ngModel)]="formData.Crime_Volume" min="0"></div>
            <div class="form-group"><label class="form-label">Précipitations (mm)</label><input type="number" class="form-control" [(ngModel)]="formData.Precipitation_mm" step="0.1"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">City</label><select class="form-control" [(ngModel)]="formData.City"><option>Paris</option><option>Lyon</option><option>Marseille</option><option>Bordeaux</option><option>Lille</option><option>Nantes</option><option>Strasbourg</option><option>Montpellier</option></select></div>
            <div class="form-group"><label class="form-label">Safety Level</label><select class="form-control" [(ngModel)]="formData.Safety_Level"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Month</label><select class="form-control" [(ngModel)]="formData.Month_Name"><option>January</option><option>February</option><option>March</option><option>April</option><option>May</option><option>June</option><option>July</option><option>August</option><option>September</option><option>October</option><option>November</option><option>December</option></select></div>
            <div class="form-group"><label class="form-label">Hour Interval</label><select class="form-control" [(ngModel)]="formData.Hour_Interval"><option>00:00 - 01:00</option><option>01:00 - 02:00</option><option>02:00 - 03:00</option><option>03:00 - 04:00</option><option>04:00 - 05:00</option><option>05:00 - 06:00</option><option>06:00 - 07:00</option><option>07:00 - 08:00</option><option>08:00 - 09:00</option><option>09:00 - 10:00</option><option>10:00 - 11:00</option><option>11:00 - 12:00</option><option selected>12:00 - 13:00</option><option>13:00 - 14:00</option><option>14:00 - 15:00</option><option>15:00 - 16:00</option><option>16:00 - 17:00</option><option>17:00 - 18:00</option><option>18:00 - 19:00</option><option>19:00 - 20:00</option><option>20:00 - 21:00</option><option>21:00 - 22:00</option><option>22:00 - 23:00</option><option>23:00 - 00:00</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Is Weekend</label><select class="form-control" [(ngModel)]="formData.Is_Weekend"><option selected>No</option><option>Yes</option></select></div>
            <div class="form-group"><label class="form-label">Peak Status</label><select class="form-control" [(ngModel)]="formData.Peak_Status"><option>Night</option><option>Peak</option><option selected>Off-Peak</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Socio Economic Group</label><select class="form-control" [(ngModel)]="formData.Socio_Economic_Group"><option>High</option><option selected>Medium</option><option>Low</option></select></div>
            <div class="form-group"><label class="form-label">Stop Type</label><select class="form-control" [(ngModel)]="formData.Stop_Type"><option>Standard</option></select></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Weather Conditions</label><select class="form-control" [(ngModel)]="formData.Weather_Conditions"><option>Clear</option><option>Mainly Clear</option><option>Cloudy</option><option>Rain</option><option>Other</option></select></div>
            <div class="form-group"><label class="form-label">Season</label><select class="form-control" [(ngModel)]="formData.Season"><option>Spring</option><option selected>Summer</option><option>Autumn</option><option>Winter</option></select></div>
          </div>
          <button class="btn btn-primary" style="background:linear-gradient(135deg,#9d6eff,#7c3aed);width:100%;margin-top:12px" (click)="predict()" [disabled]="loading"><span *ngIf="loading">⏳</span>{{ loading ? 'Prédiction...' : 'Prédire Accidents' }}</button>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h2 class="card-title">Résultat</h2></div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2)"><p>Cliquez sur Prédire</p></div>
          <div *ngIf="loading" class="text-center"><div class="spinner"></div></div>
          <div *ngIf="result && !loading">
            <div class="result-header" [style.background]="getColor() + '12'" [style.border]="'2px solid ' + getColor() + '40'" style="text-align:center;padding:20px;border-radius:10px">
              <div style="font-size:48px;margin-bottom:8px">{{ getEmoji() }}</div>
              <div [style.color]="getColor()" style="font-size:42px;font-weight:800">{{ getPredictedAccidents() | number:'1.0' }}</div>
              <div style="font-size:16px;color:#94a3b8;margin-top:4px">accidents prédits</div>
              <div [style.background]="getColor() + '20'" [style.color]="getColor()" style="margin-top:12px;padding:8px 16px;border-radius:20px;display:inline-block;font-size:14px"><b>{{ getRiskLevel() }}</b></div>
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
export class PimlDComponent {
  loading = false;
  result: any = null;
  formData = { Crime_Volume: 8, Precipitation_mm: 5.0, City: 'Paris', Safety_Level: 'Medium', Month_Name: 'January', Hour_Interval: '12:00 - 13:00', Is_Weekend: 'No', Peak_Status: 'Off-Peak', Socio_Economic_Group: 'Medium', Stop_Type: 'Standard', Weather_Conditions: 'Clear', Season: 'Summer' };
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  predict() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/piml/d/predict`, this.formData).pipe(
      catchError(err => { this.loading = false; this.cdr.markForCheck(); return throwError(() => err); })
    ).subscribe({
      next: (data: any) => { this.result = data; this.loading = false; this.cdr.markForCheck(); }
    });
  }
  getPredictedAccidents(): number {
    if (!this.result) return 0;
    return this.result.predicted_accidents ??
           this.result.prediction ??
           this.result.value ?? 0;
  }
  getRiskLevel(): string {
    if (!this.result) return '';
    return this.result.risk_level ?? '';
  }
  getEmoji(): string {
    const val = this.getPredictedAccidents();
    if (val > 7) return '😰';
    if (val > 4) return '😟';
    if (val > 2) return '😐';
    return '😊';
  }
  getColor(): string {
    return this.result?.color ?? '#00e5a0';
  }
}