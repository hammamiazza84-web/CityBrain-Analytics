import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-client-stress',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
      <div class="page-header">
        <h1>🧠 Évaluer mon Stress</h1>
        <p>Découvrez votre niveau de stress lié au transport</p>
      </div>
      
      <div class="evaluation-card">
        <div class="card-header">
          <h2>Questionnaire de Stress</h2>
        </div>
        
        <div class="simplified-form">
          <div class="essential-fields">
            <div class="form-group">
              <label>🚆 Moyen de transport</label>
              <select [(ngModel)]="formData.User_Category">
                <option value="metro">🚇 Métro</option>
                <option value="bus">🚌 Bus</option>
                <option value="voiture">🚗 Voiture</option>
                <option value="vélo">🚴 Vélo</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>🕐 Moment de la journée</label>
              <select [(ngModel)]="formData.Peak_Status">
                <option value="Peak">🔴 Heures de pointe</option>
                <option value="Off-Peak">🟡 Heures creuses</option>
                <option value="Night">🌙 Nuit</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>🌤️ Saison</label>
              <select [(ngModel)]="formData.Season">
                <option value="Summer">☀️ Été</option>
                <option value="Spring">🌸 Printemps</option>
                <option value="Autumn">🍂 Automne</option>
                <option value="Winter">❄️ Hiver</option>
              </select>
            </div>
          </div>
          
          <div class="sentiment-section">
            <div class="slider-group">
              <label>
                😊 Comment vous sentez-vous ? (1–5) : 
                <strong class="slider-value">{{ formData.Sentiment_Score }}</strong>
              </label>
              <input 
                type="range" 
                min="1" 
                max="5" 
                [(ngModel)]="formData.Sentiment_Score"
                class="slider"
              >
              <div class="sentiment-labels">
                <span>😊 Très bien</span>
                <span>😟 Stressé</span>
              </div>
            </div>
          </div>
        </div>
        
        <button class="btn-evaluate" (click)="evaluate()" [disabled]="loading">
          <span *ngIf="loading">⏳ Analyse...</span>
          <span *ngIf="!loading">🧠 Évaluer mon Stress</span>
        </button>
      </div>
      
      <div class="result-card" *ngIf="result">
        <div class="professional-result">
          <div class="result-header">
            <div class="result-badge" [style.background]="getColor() + '20'" [style.color]="getColor()">
              {{ getEmoji() }} {{ result.label }}
            </div>
            <div class="result-score">
              Niveau {{ result.prediction }}/5
            </div>
          </div>
          
          <div class="result-summary">
            <div class="summary-item">
              <span class="summary-label">Score de stress</span>
              <span class="summary-value" [style.color]="getColor()">{{ result.prediction }}/5</span>
            </div>
            <div class="summary-item">
              <span class="summary-label">Confiance</span>
              <span class="summary-value">{{ getConfidence() }}%</span>
            </div>
          </div>
          
          <div class="professional-recommendation" [class]="getRecClass()">
            <div class="rec-header">
              <strong>Recommandation</strong>
            </div>
            <div class="rec-content">
              {{ result.recommendation }}
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
    }
    
    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--c-text);
      margin-bottom: 0.5rem;
    }
    
    .page-header p {
      color: var(--c-text2);
    }
    
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
    
    .card-header h2 {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--c-text);
    }
    
    .badge {
      padding: 6px 12px;
      background: rgba(0, 194, 255, 0.15);
      color: #00c2ff;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
    }
    
    .simplified-form {
      margin-bottom: 2rem;
    }
    
    .essential-fields {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--bg);
      border-radius: 12px;
      border: 1px solid var(--border);
    }
    
    .sentiment-section {
      padding: 1.5rem;
      background: rgba(0, 194, 255, 0.05);
      border-radius: 12px;
      border: 1px solid rgba(0, 194, 255, 0.2);
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
    
    .form-group select {
      padding: 10px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--c-text);
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .form-group select:focus {
      outline: none;
      border-color: #00c2ff;
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 0 3px rgba(0, 194, 255, 0.1);
    }
    
    .form-group select:hover {
      border-color: rgba(0, 194, 255, 0.5);
      background: rgba(255, 255, 255, 0.1);
    }
    
    .form-group select option {
      background: var(--bg2);
      color: var(--c-text);
      padding: 8px 12px;
      border: none;
    }
    
    .slider-group {
      margin-bottom: 1rem;
    }
    
    .slider-group label {
      display: block;
      font-size: 1rem;
      color: var(--c-text);
      margin-bottom: 12px;
      font-weight: 500;
    }
    
    .sentiment-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
      font-size: 0.85rem;
      color: var(--c-text2);
    }
    
    .slider-value {
      color: #00c2ff;
    }
    
    .slider {
      width: 100%;
      height: 6px;
      background: var(--border);
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
    }
    
    .slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      background: #00c2ff;
      border-radius: 50%;
      cursor: pointer;
    }
    
    .btn-evaluate {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #00c2ff, #0072ff);
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
      box-shadow: 0 6px 24px rgba(0, 114, 255, 0.35);
    }
    
    .btn-evaluate:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
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
    
    .stress-result {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border-radius: 12px;
      margin-bottom: 1.5rem;
    }
    
    .result-emoji {
      font-size: 3rem;
    }
    
    .result-level {
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .result-details {
      font-size: 0.85rem;
      color: var(--c-text2);
      margin-top: 4px;
    }
    
    .probabilities h3 {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--c-text2);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 1rem;
      opacity: 0.9;
    }
    
    .prob-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    
    .prob-label {
      width: 100px;
      font-size: 0.8rem;
      color: var(--c-text2);
      text-transform: uppercase;
    }
    
    .prob-track {
      flex: 1;
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .prob-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.5s ease;
    }
    
    .prob-value {
      width: 50px;
      font-size: 0.8rem;
      color: var(--c-text2);
      text-align: right;
    }
    
    .recommendation {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 10px;
      font-size: 0.95rem;
    }
    
    .rec-low {
      background: rgba(0, 229, 160, 0.1);
      border: 1px solid rgba(0, 229, 160, 0.3);
      color: #00e5a0;
    }
    
    .rec-medium {
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      color: #ff9800;
    }
    
    .rec-high {
      background: rgba(255, 77, 106, 0.1);
      border: 1px solid rgba(255, 77, 106, 0.3);
      color: #ff4d6a;
    }
    
    /* Professional Result Styles */
    .professional-result {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    
    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--border);
    }
    
    .result-badge {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
    }
    
    .result-score {
      font-size: 1rem;
      color: var(--c-text2);
      font-weight: 500;
    }
    
    .result-summary {
      display: flex;
      gap: 2rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background: var(--bg);
      border-radius: 8px;
    }
    
    .summary-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .summary-label {
      font-size: 0.8rem;
      color: var(--c-text2);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .summary-value {
      font-size: 1.2rem;
      font-weight: 600;
      color: var(--c-text);
    }
    
    .professional-recommendation {
      padding: 1rem;
      border-radius: 8px;
    }
    
    .rec-header {
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }
    
    .rec-content {
      font-size: 0.95rem;
      line-height: 1.4;
    }
    
    .rec-low {
      background: rgba(0, 229, 160, 0.1);
      border: 1px solid rgba(0, 229, 160, 0.3);
      color: #00e5a0;
    }
    
    .rec-medium {
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      color: #ff9800;
    }
    
    .rec-high {
      background: rgba(255, 77, 106, 0.1);
      border: 1px solid rgba(255, 77, 106, 0.3);
      color: #ff4d6a;
    }
  `]
})
export class ClientStressComponent {
  loading = false;
  result: any = null;
  formData = {
    User_Category: 'metro',
    Peak_Status: 'Peak',
    Season: 'Summer',
    Sentiment_Score: 3
  };
  
  private apiUrl = environment.apiUrl;
  
  emojis: { [key: number]: string } = {
    1: '😊', 2: '😐', 3: '😟', 4: '😰', 5: '🤯'
  };
  
  colors: { [key: number]: string } = {
    1: '#4CAF50', 2: '#FF9800', 3: '#FF5722', 4: '#F44336', 5: '#9C27B0'
  };
  
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  
  evaluate(): void {
    this.loading = true;
    this.cdr.markForCheck();
    
    this.http.post(`${this.apiUrl}/stress/predict`, this.formData).pipe(
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
  
  getEmoji(): string {
    return this.emojis[this.result?.prediction] || '❓';
  }
  
  getColor(): string {
    return this.colors[this.result?.prediction] || '#00c2ff';
  }
  
  getConfidence(): string {
    return ((this.result?.confidence || 0) * 100).toFixed(1);
  }
  
  getProbabilities(): any[] {
    if (!this.result?.probabilities) return [];
    return Object.entries(this.result.probabilities).map(([k, v]: [string, any]) => ({
      label: k.replace(/_/g, ' ').toUpperCase(),
      value: (v * 100).toFixed(1),
      color: this.getColor()
    }));
  }
  
  getRecClass(): string {
    const level = this.result?.prediction;
    if (level >= 4) return 'rec-high';
    if (level >= 3) return 'rec-medium';
    return 'rec-low';
  }
}