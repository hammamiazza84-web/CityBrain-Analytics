import { Component, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import Chart from 'chart.js/auto';
import { environment } from '@env/environment';

@Component({
  selector: 'app-infra-ts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">🏗️ Infrastructure — Séries Temporelles</h1>
      <p class="page-subtitle">Prévision de la consommation énergétique</p>
    </div>

    <div class="chart-card">
      <div class="chart-header">
        <h3>⚡ Prévision Énergie (SARIMA)</h3>
        <div class="chart-controls">
          <span class="badge">SARIMA</span>
          <select [(ngModel)]="formData.months" class="control-select">
            <option [value]="3">3 mois</option>
            <option [value]="6">6 mois</option>
            <option [value]="12">12 mois</option>
          </select>
          <select [(ngModel)]="formData.method" class="control-select">
            <option value="seasonal">Saisonnier</option>
            <option value="trend">Tendance</option>
          </select>
          <button class="btn-lancer" (click)="predict()" [disabled]="loading">
            <span *ngIf="!loading">▶ Lancer</span>
            <span *ngIf="loading">⏳...</span>
          </button>
        </div>
      </div>

      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>

      <div class="chart-legend">
        <div class="legend-item">
          <span class="legend-line solid"></span>
          <span>Historique</span>
        </div>
        <div class="legend-item">
          <span class="legend-line dashed"></span>
          <span>SARIMA Prévision</span>
        </div>
      </div>
    </div>

    <div *ngIf="result" class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ getLastValue() }}</div>
        <div class="stat-label">Dernière valeur (kWh)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ getForecastAvg() }}</div>
        <div class="stat-label">Moyenne prévue (kWh)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ getTrend() }}</div>
        <div class="stat-label">Tendance</div>
      </div>
    </div>
  `,
  styles: [`
    .chart-card {
      background: rgba(22, 34, 54, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .chart-header h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .chart-controls {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .badge {
      padding: 4px 12px;
      background: rgba(255, 77, 106, 0.15);
      color: #ff4d6a;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
    }

    .control-select {
      padding: 6px 12px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 6px;
      color: #fff;
      font-size: 0.85rem;
      cursor: pointer;
    }

    .btn-lancer {
      padding: 6px 16px;
      background: linear-gradient(135deg, #00c2ff, #0072ff);
      border: none;
      border-radius: 6px;
      color: #fff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .btn-lancer:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .chart-container {
      height: 400px;
      position: relative;
    }

    .chart-legend {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.7);
    }

    .legend-line {
      width: 24px;
      height: 2px;
      border-radius: 1px;
    }

    .legend-line.solid {
      background: #8ba3c7;
    }

    .legend-line.dashed {
      background: #ff4d6a;
      background: repeating-linear-gradient(90deg, #ff4d6a 0px, #ff4d6a 4px, transparent 4px, transparent 8px);
      height: 2px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: rgba(22, 34, 54, 0.6);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 1.25rem;
      text-align: center;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #00c2ff;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.5);
    }
  `]
})
export class InfraTsComponent implements AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef;
  chart: any;
  loading = false;
  result: any = null;
  formData = { months: 6, method: 'seasonal' };
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngAfterViewInit() {
    this.initChart();
    // Load initial mock data
    this.loadMockData();
  }

  initChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Historique',
            data: [],
            borderColor: '#8ba3c7',
            backgroundColor: 'rgba(139, 163, 199, 0.1)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          },
          {
            label: 'SARIMA',
            data: [],
            borderColor: '#ff4d6a',
            backgroundColor: 'rgba(255, 77, 106, 0.1)',
            borderWidth: 2,
            borderDash: [8, 4],
            tension: 0.4,
            pointRadius: 3,
            pointBackgroundColor: '#ff4d6a'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(6, 11, 20, 0.9)',
            borderColor: 'rgba(0, 194, 255, 0.3)',
            borderWidth: 1,
            titleColor: '#00c2ff',
            bodyColor: '#fff',
            padding: 12,
            displayColors: true
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)', maxTicksLimit: 8 }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: 'rgba(255, 255, 255, 0.5)' },
            title: { display: true, text: 'kWh', color: 'rgba(255, 255, 255, 0.5)' }
          }
        }
      }
    });
  }

  loadMockData() {
    // Generate mock historical data (2020-2022)
    const months = 36;
    const labels = [];
    const historical = [];
    const forecast = [];

    const baseDate = new Date('2020-01-01');
    for (let i = 0; i < months; i++) {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + i);
      labels.push(date.toISOString().split('T')[0]);

      // Seasonal pattern: higher in winter, lower in summer
      const month = date.getMonth();
      const seasonal = Math.cos((month - 6) / 12 * 2 * Math.PI) * 150;
      const trend = i * 2;
      const noise = (Math.random() - 0.5) * 50;
      historical.push(350 + seasonal + trend + noise);
      forecast.push(null);
    }

    // Add forecast data (6 months)
    for (let i = 0; i < 6; i++) {
      const date = new Date(baseDate);
      date.setMonth(date.getMonth() + months + i);
      labels.push(date.toISOString().split('T')[0]);
      historical.push(null);

      const month = date.getMonth();
      const seasonal = Math.cos((month - 6) / 12 * 2 * Math.PI) * 150;
      const trend = (months + i) * 2;
      forecast.push(350 + seasonal + trend);
    }

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = historical;
    this.chart.data.datasets[1].data = forecast;
    this.chart.update();
  }

  predict() {
    this.loading = true;
    this.cdr.markForCheck();

    this.http.post(`${this.apiUrl}/infra/timeseries/forecast`, this.formData).pipe(
      catchError(err => {
        this.loading = false;
        this.cdr.markForCheck();
        return throwError(() => err);
      })
    ).subscribe({
      next: (data: any) => {
        this.result = data;
        this.updateChart(data);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  updateChart(data: any) {
    if (!data || !this.chart) return;

    const labels = data.dates || [];
    const historical = data.historical || [];
    const forecast = data.forecast || [];

    this.chart.data.labels = labels;
    this.chart.data.datasets[0].data = historical;
    this.chart.data.datasets[1].data = forecast;
    this.chart.update();
  }

  getLastValue(): string {
    if (!this.result?.historical?.length) return '-';
    const last = this.result.historical[this.result.historical.length - 1];
    return last ? last.toFixed(0) : '-';
  }

  getForecastAvg(): string {
    if (!this.result?.forecast?.length) return '-';
    const avg = this.result.forecast.reduce((a: number, b: number) => a + b, 0) / this.result.forecast.length;
    return avg.toFixed(0);
  }

  getTrend(): string {
    if (!this.result?.forecast?.length) return '-';
    const first = this.result.forecast[0];
    const last = this.result.forecast[this.result.forecast.length - 1];
    const change = ((last - first) / first) * 100;
    return change > 0 ? `↗ +${change.toFixed(1)}%` : `↘ ${change.toFixed(1)}%`;
  }
}