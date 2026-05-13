import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-carbon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
      <div class="page-header">
        <h1>🌱 Empreinte Carbone</h1>
        <p>Calculez l'impact environnemental de vos déplacements</p>
      </div>
      
      <div class="evaluation-card">
        <div class="card-header">
          <h2>Vos trajets hebdomadaires</h2>
        </div>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Distance (km/jour)</label>
            <input type="number" [(ngModel)]="formData.distance" min="0" step="0.1">
          </div>
          <div class="form-group">
            <label>Mode de transport</label>
            <select [(ngModel)]="formData.mode">
              <option value="metro">🚇 Métro</option>
              <option value="bus">🚌 Bus</option>
              <option value="voiture">🚗 Voiture</option>
              <option value="velo">🚴 Vélo</option>
              <option value="marche">🚶 Marche</option>
            </select>
          </div>
          <div class="form-group">
            <label>Jours/semaine</label>
            <input type="number" [(ngModel)]="formData.days_per_week" min="1" max="7">
          </div>
          <div class="form-group">
            <label>Personnes dans le véhicule</label>
            <input type="number" [(ngModel)]="formData.occupants" min="1" max="8">
          </div>
        </div>
        
        <button class="btn-evaluate" (click)="calculate()">
          🌱 Calculer mon Impact
        </button>
      </div>
      
      <div class="result-card" *ngIf="result">
        <div class="alternatives">
          <h3>💡 Alternatives plus vertes</h3>
          <div class="alt-grid">
            <div class="alt-card" *ngFor="let alt of result.alternatives">
              <div class="alt-mode">{{ alt.icon }} {{ alt.mode }}</div>
              <div class="alt-savings">-{{ alt.savings }}%</div>
            </div>
          </div>
        </div>
        
        <div class="tips-section">
          <h3>🌿 Conseils réduction</h3>
          <ul>
            <li *ngFor="let tip of result.tips">{{ tip }}</li>
          </ul>
        </div>
      </div>
      
      <!-- Section Prédiction CO2 avec Météo -->
      <div class="co2-ml-section">
        <div class="section-header">
          <h2>Prédiction CO2 Avancée</h2>
          <span class="badge">ML Gradient Boosting</span>
        </div>
        <p class="section-desc">Prédiction basée sur le temps et les conditions météo</p>
        
        <div class="form-grid">
          <div class="form-group">
            <label>Mois (1-12)</label>
            <input type="number" [(ngModel)]="co2Form.Month" min="1" max="12">
          </div>
          <div class="form-group">
            <label>Heure (0-23)</label>
            <input type="number" [(ngModel)]="co2Form.Hour" min="0" max="23">
          </div>
          <div class="form-group">
            <label>Jour semaine (0=Lun, 6=Dim)</label>
            <input type="number" [(ngModel)]="co2Form.DayOfWeek" min="0" max="6">
          </div>
          <div class="form-group">
            <label>Saison (0=Hiv, 1=Prt, 2=Été, 3=Aut)</label>
            <input type="number" [(ngModel)]="co2Form.Season_num" min="0" max="3">
          </div>
          <div class="form-group">
            <label>Température (°C)</label>
            <input type="number" [(ngModel)]="co2Form.Temperature_Celsius" min="-20" max="45" step="0.5">
          </div>
          <div class="form-group">
            <label>Météo</label>
            <select [(ngModel)]="co2Form.Weather_Condition">
              <option value="Clear">☀️ Clear (Ensoleillé)</option>
              <option value="Mainly Clear">🌤️ Mainly Clear</option>
              <option value="Cloudy" selected>☁️ Cloudy (Nuageux)</option>
              <option value="Rain">🌧️ Rain (Pluie)</option>
              <option value="Other">🌪️ Other (Autre)</option>
            </select>
          </div>
        </div>
        
        <button class="btn-evaluate co2-btn" (click)="predictCo2()" [disabled]="loading">
          {{ loading ? 'Calcul en cours...' : 'Prédire les Émissions CO2' }}
        </button>
        
        <div class="co2-result" *ngIf="co2Result">
          <div class="result-box" [style.background]="co2Result.color + '20'" [style.border-color]="co2Result.color">
            <div class="result-label">{{ co2Result.label }}</div>
            <div class="result-value" [style.color]="co2Result.color">{{ co2Result.predicted_co2_kg }} <span>kg CO2</span></div>
            <div class="result-model">{{ co2Result.model }}</div>
          </div>
          <div class="result-alert" [class.high]="co2Result.above_threshold">
            {{ co2Result.above_threshold 
              ? 'Émissions au-dessus du seuil de 100 kg. Recommandez des modes de transport alternatifs.' 
              : 'Émissions dans les normes acceptables.' }}
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
    }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: var(--c-text); margin-bottom: 0.5rem; }
    .page-header p { color: var(--c-text2); }
    
    .evaluation-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    .card-header h2 { font-size: 1.2rem; font-weight: 600; color: var(--c-text); }
    .badge {
      padding: 6px 12px;
      background: rgba(0, 229, 160, 0.15);
      color: #00e5a0;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
    }
    
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .form-group { display: flex; flex-direction: column; gap: 6px; }
    .form-group label {
      font-size: 0.8rem; color: var(--c-text2); font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .form-group input, .form-group select {
      padding: 10px 12px; background: var(--bg);
      border: 1px solid var(--border); border-radius: 8px;
      color: var(--c-text); font-size: 0.95rem; cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .form-group input:focus, .form-group select:focus {
      outline: none; border-color: #00e5a0;
      background: rgba(255,255,255,0.12);
      box-shadow: 0 0 0 3px rgba(0, 229, 160, 0.1);
    }
    
    .form-group select:hover {
      border-color: rgba(0, 229, 160, 0.5);
      background: rgba(255,255,255,0.1);
    }
    
    .form-group select option {
      background: var(--bg2); color: var(--c-text);
      padding: 8px 12px; border: none;
    }
    
    .btn-evaluate {
      width: 100%; padding: 14px;
      background: linear-gradient(135deg, #00e5a0, #00c2ff);
      color: #fff; font-size: 1rem; font-weight: 600;
      border: none; border-radius: 10px; cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-evaluate:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0, 229, 160, 0.35); }
    
    .result-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 1.5rem;
      animation: fadeIn 0.4s ease;
    }
    
    .alternatives h3, .tips-section h3 {
      font-size: 0.9rem; font-weight: 600; color: var(--c-text);
      margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 1px;
    }
    
    .alt-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
    .alt-card {
      background: var(--bg); border: 1px solid var(--border);
      border-radius: 10px; padding: 1rem; text-align: center;
    }
    .alt-mode { font-size: 0.9rem; color: var(--c-text); margin-bottom: 0.5rem; }
    .alt-savings { font-size: 1.2rem; font-weight: 700; color: #00e5a0; }
    
    .tips-section ul { list-style: none; padding: 0; }
    .tips-section li {
      padding: 0.75rem; background: var(--bg);
      border-radius: 8px; margin-bottom: 0.5rem;
      font-size: 0.9rem; color: var(--c-text2);
    }
    
    .co2-ml-section {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px; padding: 1.5rem;
      margin-top: 1.5rem;
    }
    .section-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.5rem;
    }
    .section-header h2 { font-size: 1.2rem; font-weight: 600; color: var(--c-text); }
    .section-desc { color: var(--c-text2); margin-bottom: 1.5rem; font-size: 0.9rem; }
    .co2-btn { background: linear-gradient(135deg, #00e5a0, #059669) !important; }
    .co2-btn:hover { box-shadow: 0 6px 24px rgba(0, 229, 160, 0.35) !important; }
    .co2-btn:disabled { opacity: 0.6; cursor: not-allowed; }
    
    .co2-result { margin-top: 1.5rem; }
    .result-box {
      text-align: center; padding: 1.5rem;
      border: 2px solid; border-radius: 12px;
      margin-bottom: 1rem;
    }
    .result-label { font-size: 1.4rem; font-weight: 600; color: var(--c-text); margin-bottom: 0.5rem; }
    .result-value { font-size: 2.5rem; font-weight: 800; }
    .result-value span { font-size: 1rem; font-weight: 400; opacity: 0.7; }
    .result-model { font-size: 0.8rem; color: var(--c-text2); margin-top: 0.5rem; }
    .result-alert {
      padding: 1rem; border-radius: 8px; font-size: 0.9rem;
      background: rgba(0, 229, 160, 0.1); border: 1px solid rgba(0, 229, 160, 0.3);
      color: #00e5a0;
    }
    .result-alert.high {
      background: rgba(255, 77, 106, 0.1); border-color: rgba(255, 77, 106, 0.3);
      color: #ff4d6a;
    }
  `]
})
export class ClientCarbonComponent {
  // Formulaire CO2 ML
  co2Form = {
    Month: 6,
    Hour: 13,
    DayOfWeek: 0,
    Season_num: 1,
    Temperature_Celsius: 15,
    Weather_Condition: 'Cloudy'
  };
  co2Result: any = null;
  loading = false;
  
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}
  
  predictCo2(): void {
    this.loading = true;
    this.apiService.predictCo2(this.co2Form).subscribe({
      next: (response) => {
        this.co2Result = response;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur prédiction CO2:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  // Ancien calculateur simple (gardé pour compatibilité)
  formData = {
    distance: 10,
    mode: 'metro',
    days_per_week: 5,
    occupants: 1
  };
  result: any = null;
  
  // kg CO2 par km pour chaque mode
  emissionFactors: { [key: string]: number } = {
    metro: 0.004,
    bus: 0.089,
    voiture: 0.21,
    velo: 0,
    marche: 0
  };
  
  icons: { [key: string]: string } = {
    metro: '🚇', bus: '🚌', voiture: '🚗', velo: '🚴', marche: '🚶'
  };
  
  calculate(): void {
    const factor = this.emissionFactors[this.formData.mode] || 0;
    const totalKm = this.formData.distance * this.formData.days_per_week * 2; // aller-retour
    let totalKg = (totalKm * factor) / this.formData.occupants;
    
    // Générer alternatives
    const alternatives = Object.entries(this.emissionFactors)
      .filter(([mode]) => mode !== this.formData.mode && factor > 0)
      .map(([mode, f]) => ({
        mode: mode.charAt(0).toUpperCase() + mode.slice(1),
        icon: this.icons[mode],
        savings: Math.round(((factor - f) / factor) * 100)
      }))
      .sort((a, b) => b.savings - a.savings)
      .slice(0, 3);
    
    // Déterminer le niveau d'impact
    let impactClass = 'low';
    let comparison = '🌟 Excellent! Votre impact est minimal.';
    if (totalKg > 5) {
      impactClass = 'medium';
      comparison = '⚠️ Impact modéré. Des alternatives existent.';
    }
    if (totalKg > 15) {
      impactClass = 'high';
      comparison = '🔴 Impact élevé. Envisagez des alternatives vertes.';
    }
    
    this.result = {
      total_kg: totalKg.toFixed(2),
      impact_class: impactClass,
      icon: this.icons[this.formData.mode],
      comparison,
      alternatives,
      tips: [
        'Privilégiez le covoiturage pour réduire vos émissions',
        'Le télétravail 1 jour/semaine = -20% de CO2',
        'Le vélo pour les trajets < 5km = 0 émission',
        'Les transports en commun émettent 10x moins que la voiture'
      ]
    };
  }
}
