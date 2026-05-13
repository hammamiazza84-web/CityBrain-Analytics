import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Component({
  selector: 'app-piml-g',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <h1 class="page-title">📝 Analyse des Retours Usagers</h1>
      <p class="page-subtitle">Intelligence textuelle pour transformer les retours citoyens en actions concrètes</p>
    </div>
    
    <div class="grid-2">
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Saisie des Témoignages</h2>
        </div>
        <div class="card-body">
          <div class="info-box">
            Cet outil analyse automatiquement la nature des signalements et le sentiment global des usagers.
          </div>
          
          <div class="example-buttons">
            <button class="btn-example accident" (click)="setExample('accident')">💥 Urgence</button>
            <button class="btn-example incident" (click)="setExample('incident')">⚠️ Signalement</button>
            <button class="btn-example safety" (click)="setExample('safety')">✅ Satisfaction</button>
          </div>
          
          <div class="form-group">
            <label class="form-label-small">Commentaire ou Rapport d'Incident</label>
            <textarea class="form-control" [(ngModel)]="formData.text" rows="5" placeholder="Saisissez ici le retour de l'usager ou le rapport de l'agent..."></textarea>
          </div>
          
          <button class="btn-analyze" (click)="classify()" [disabled]="loading">
            <span *ngIf="loading">⏳ Analyse sémantique...</span>
            <span *ngIf="!loading">🕵️ Extraire les Insights</span>
          </button>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Diagnostic Textuel</h2>
        </div>
        <div class="card-body">
          <div *ngIf="!result && !loading" class="text-center" style="color:var(--c-text2); padding: 3rem;">
            <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
            <p>Le moteur d'analyse est prêt. Saisissez un texte pour commencer.</p>
          </div>
          
          <div *ngIf="loading" class="text-center" style="padding: 3rem;">
            <div class="spinner"></div>
            <p style="margin-top: 1rem;">Interprétation du langage naturel...</p>
          </div>
          
          <div *ngIf="result && !loading" class="result-container">
            <div class="result-icon">{{ getIncidentIcon() }}</div>
            <div style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2);">Nature identifiée :</div>
            <div class="result-title">{{ getManagerCategory() }}</div>
            
            <div class="result-sentiment">
              Sentiment usager : 
              <span [class.positive]="isPositive()" [class.negative]="!isPositive()" style="font-weight: 700;">
                {{ getManagerSentiment() }}
              </span>
            </div>
            
            <div class="probabilities" style="margin-top: 2rem;">
              <h4 style="font-size: 0.85rem; text-transform: uppercase; color: var(--c-text2); margin-bottom: 1rem;">Fiabilité de la classification</h4>
              <div class="prob-item" *ngFor="let prob of getProbabilities()">
                <span class="prob-name">{{ getManagerLabel(prob.name) }}</span>
                <div class="prob-bar-container">
                  <div class="prob-bar" [style.width.%]="prob.value" [class.winner]="prob.isWinner"></div>
                </div>
                <span class="prob-value">{{ prob.value }}%</span>
              </div>
            </div>

            <div class="alert" [class]="isPositive() ? 'alert-success' : 'alert-warning'" style="margin-top: 2rem; text-align: left;">
              <div style="font-weight: 700; margin-bottom: 0.5rem;">💡 Recommandation de Traitement :</div>
              {{ getNLPRecommendation() }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .info-box { background: rgba(0, 194, 255, 0.08); border-left: 3px solid #00c2ff; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-size: 0.9rem; color: #8ba3c7; }
    .example-buttons { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
    .btn-example { padding: 10px 16px; border: none; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
    .btn-example:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
    .btn-example.accident { background: rgba(255, 77, 106, 0.15); color: #ff4d6a; }
    .btn-example.incident { background: rgba(255, 170, 0, 0.15); color: #ffaa00; }
    .btn-example.safety { background: rgba(0, 229, 160, 0.15); color: #00e5a0; }
    .form-label-small { font-size: 0.75rem; color: #8ba3c7; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; display: block; font-weight: 600; }
    .btn-analyze { width: 100%; padding: 16px; background: linear-gradient(135deg, #00c2ff, #007bff); border: none; border-radius: 10px; color: #fff; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; font-size: 1rem; transition: all 0.2s; }
    .btn-analyze:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,194,255,0.3); }
    .btn-analyze:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
    .result-container { padding: 10px 0; }
    .result-icon { font-size: 4rem; margin-bottom: 1rem; }
    .result-title { font-size: 2.2rem; font-weight: 800; color: #fff; margin-bottom: 10px; }
    .result-sentiment { font-size: 1rem; color: #8ba3c7; margin-bottom: 2rem; }
    .result-sentiment .positive { color: #00e5a0; }
    .result-sentiment .negative { color: #ff8f3c; }
    .probabilities { text-align: left; }
    .prob-item { display: flex; align-items: center; gap: 15px; margin-bottom: 12px; }
    .prob-name { width: 110px; font-size: 0.85rem; color: #8ba3c7; font-weight: 500; }
    .prob-bar-container { flex: 1; height: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 5px; overflow: hidden; }
    .prob-bar { height: 100%; background: #334155; border-radius: 5px; transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1); }
    .prob-bar.winner { background: linear-gradient(90deg, #00c2ff, #00e5a0); }
    .prob-value { width: 50px; text-align: right; font-size: 0.9rem; color: #fff; font-weight: 700; }
  `]
})
export class PimlGComponent {
  loading = false;
  result: any = null;
  formData = { text: 'Le trafic est très dense ce matin avec beaucoup de retard sur la ligne principale.' };
  
  private apiUrl = environment.apiUrl;
  
  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef
  ) {}
  
  setExample(type: string) {
    const examples: { [key: string]: string } = {
      accident: 'Accident de la circulation avec collision entre deux véhicules sur l\'autoroute. Blessés légers, pompiers sur place.',
      incident: 'Retard important sur la ligne 4 du métro en raison d\'un bagage oublié sur les voies. Service perturbé.',
      safety: 'Tous les systèmes de sécurité fonctionnent normalement. Aucun incident signalé aujourd\'hui sur le réseau.'
    };
    this.formData.text = examples[type] || '';
    this.cdr.markForCheck();
  }

  classify() {
    this.loading = true;
    this.cdr.markForCheck();
    this.http.post(`${this.apiUrl}/piml/g/predict`, this.formData).pipe(
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

  getManagerCategory(): string {
    const cat = this.getMainCategory().toLowerCase();
    if (cat.includes('accident')) return 'Urgence Majeure';
    if (cat.includes('incident')) return 'Incident de Service';
    if (cat.includes('safety') || cat.includes('sûreté')) return 'Retour de Sûreté';
    return 'Catégorie Mixte';
  }

  getManagerSentiment(): string {
    const s = this.getSentiment();
    if (s === 'Positif') return 'Satisfaction Usager';
    if (s === 'Négatif') return 'Frustration Détectée';
    return 'Témoignage Neutre';
  }

  getManagerLabel(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('accident')) return 'Accident';
    if (n.includes('incident')) return 'Perturbation';
    if (n.includes('safety')) return 'Sûreté';
    return name;
  }

  getNLPRecommendation(): string {
    const cat = this.getMainCategory().toLowerCase();
    const pos = this.isPositive();
    if (cat.includes('accident')) return 'ALERTE : Rapport d\'urgence. Notification immédiate des services de secours et mise à jour des panneaux d\'information usagers.';
    if (cat.includes('incident')) return 'ACTION : Signalement de service. Transférer aux équipes de régulation pour intervention technique.';
    if (pos) return 'SUIVI : Retour positif. Archiver pour les indicateurs de qualité de service (KPI).';
    return 'SUIVI : Commentaire analysé. À intégrer dans la revue hebdomadaire de satisfaction.';
  }

  getMainCategory(): string {
    if (!this.result) return '';
    return this.result.tfidf_category || this.result.prediction || this.result.category || 'Inconnu';
  }

  getIncidentIcon(): string {
    const category = this.getMainCategory().toLowerCase();
    if (category.includes('accident')) return '💥';
    if (category.includes('incident')) return '⚠️';
    if (category.includes('safety')) return '✅';
    return '📋';
  }

  getSentiment(): string {
    const sentiment = this.result?.sentiment?.toLowerCase() || '';
    if (sentiment.includes('posit')) return 'Positif';
    if (sentiment.includes('negat') || sentiment.includes('négat')) return 'Négatif';
    return 'Neutre';
  }

  isPositive(): boolean {
    return this.getSentiment() === 'Positif';
  }

  getProbabilities(): any[] {
    if (!this.result?.probabilities) return [];
    const entries = Object.entries(this.result.probabilities);
    const maxValue = Math.max(...entries.map(([, v]) => Number(v) || 0));
    
    return entries.map(([name, value]) => ({
      name: name,
      value: Math.round(Number(value) > 1 ? Number(value) : Number(value) * 100),
      isWinner: Number(value) === maxValue || Math.round(Number(value)*100) === Math.round(maxValue*100)
    }));
  }
}