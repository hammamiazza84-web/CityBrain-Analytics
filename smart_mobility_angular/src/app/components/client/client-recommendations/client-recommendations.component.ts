import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';

/** Ligne affichée (normalisée depuis la réponse API /stress/recommend). */
export interface ClientRecVm {
  time: string;
  stressNum: number | null;
  confidence: number;
  reason: string;
}

@Component({
  selector: 'app-client-recommendations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
      <div class="page-header">
        <h1>💡 Recommandations</h1>
        <p>Les meilleurs créneaux pour voyager sans stress</p>
      </div>
      
      <div class="filters-card">
        <div class="filter-row">
          <div class="filter-group">
            <label>Ville</label>
            <select [(ngModel)]="formData.city">
              <option>Paris</option>
              <option>Lyon</option>
              <option>Marseille</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Catégorie</label>
            <select [(ngModel)]="formData.user_category">
              <option>metro</option>
              <option>bus</option>
              <option>vélo</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Profil</label>
            <select [(ngModel)]="formData.mobility_profile">
              <option>Low Stress</option>
              <option>High Stress</option>
            </select>
          </div>
          <button class="btn-search" (click)="search()" [disabled]="loading">
            <span *ngIf="loading">⏳</span>
            <span *ngIf="!loading">🔍</span>
            {{ loading ? 'Recherche...' : 'Rechercher' }}
          </button>
        </div>
      </div>
      
      <div class="recommendations-grid" *ngIf="recommendations.length > 0">
        <div class="rec-card" *ngFor="let rec of recommendations; let i = index" [class.best]="i === 0">
          <div class="rec-rank" [class.top]="i < 3">{{ i + 1 }}</div>
          <div class="rec-content">
            <div class="rec-time">{{ rec.time }}</div>
            <div class="rec-details">
              <span class="rec-stress">Stress: {{ formatStress(rec) }}</span>
              <span class="rec-confidence">{{ rec.confidence }}% confiance</span>
            </div>
            <div class="rec-reason">{{ rec.reason }}</div>
          </div>
          <div class="rec-badge" *ngIf="i === 0">⭐ Meilleur créneau</div>
        </div>
      </div>
      
      <div class="empty-state" *ngIf="!loading && recommendations.length === 0 && searched && !errorMsg">
        <div class="empty-icon">📭</div>
        <p>Aucune recommandation trouvée pour ces critères.</p>
      </div>

      <div class="empty-state error-banner" *ngIf="!loading && errorMsg">
        <div class="empty-icon">⚠️</div>
        <p>{{ errorMsg }}</p>
        <p class="hint">Vérifiez que l’API est démarrée (ex. localhost:5001) et que la route POST /api/stress/recommend répond.</p>
      </div>
      
      <!-- Zones recommandées (fusionné de la page Itinéraires) -->
      <div class="zones-section">
        <h2 class="zones-title">🎯 Zones recommandées</h2>
        <p class="zones-subtitle">Basé sur l'analyse du stress moyen</p>
        
        <div class="zones-grid">
          <div class="zone-card low">
            <div class="zone-header">
              <h3>Zone A – Centre historique</h3>
              <span class="zone-badge low">Faible</span>
            </div>
            <div class="zone-stats">
              <div class="stat">
                <span class="stat-value">1.8</span>
                <span class="stat-label">Stress moyen</span>
              </div>
              <div class="stat">
                <span class="stat-value">94%</span>
                <span class="stat-label">Fiabilité</span>
              </div>
            </div>
            <div class="zone-lines">
              <span class="line">🚇 M1</span>
              <span class="line">🚇 M4</span>
              <span class="line">🚌 38</span>
              <span class="line">🚌 72</span>
            </div>
          </div>
          
          <div class="zone-card medium">
            <div class="zone-header">
              <h3>Zone B – Périphérie Nord</h3>
              <span class="zone-badge medium">Moyen</span>
            </div>
            <div class="zone-stats">
              <div class="stat">
                <span class="stat-value">3.2</span>
                <span class="stat-label">Stress moyen</span>
              </div>
              <div class="stat">
                <span class="stat-value">78%</span>
                <span class="stat-label">Fiabilité</span>
              </div>
            </div>
            <div class="zone-lines">
              <span class="line">🚇 M13</span>
              <span class="line">🚌 170</span>
              <span class="line">🚌 274</span>
            </div>
          </div>
          
          <div class="zone-card low">
            <div class="zone-header">
              <h3>Zone C – Axe Est-Ouest</h3>
              <span class="zone-badge low">Faible</span>
            </div>
            <div class="zone-stats">
              <div class="stat">
                <span class="stat-value">2.1</span>
                <span class="stat-label">Stress moyen</span>
              </div>
              <div class="stat">
                <span class="stat-value">89%</span>
                <span class="stat-label">Fiabilité</span>
              </div>
            </div>
            <div class="zone-lines">
              <span class="line">🚇 M1</span>
              <span class="line">🚇 M9</span>
              <span class="line">🚇 M14</span>
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
    
    .filters-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    
    .filter-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }
    
    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
      flex: 1;
      min-width: 150px;
    }
    
    .filter-group label {
      font-size: 0.75rem;
      color: var(--c-text2);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .filter-group select {
      padding: 10px 12px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--c-text);
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .filter-group select:focus {
      outline: none;
      border-color: #00c2ff;
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 0 3px rgba(0, 194, 255, 0.1);
    }
    
    .filter-group select:hover {
      border-color: rgba(0, 194, 255, 0.5);
      background: rgba(255, 255, 255, 0.1);
    }
    
    .filter-group select option {
      background: var(--bg2);
      color: var(--c-text);
      padding: 8px 12px;
      border: none;
    }
    
    .btn-search {
      padding: 10px 20px;
      background: linear-gradient(135deg, #00c2ff, #0072ff);
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    
    .btn-search:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 24px rgba(0, 114, 255, 0.35);
    }
    
    .btn-search:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
    
    .recommendations-grid {
      display: grid;
      gap: 1rem;
    }
    
    .rec-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      position: relative;
      transition: all 0.3s ease;
    }
    
    .rec-card:hover {
      transform: translateY(-2px);
      border-color: rgba(255, 255, 255, 0.15);
    }
    
    .rec-card.best {
      background: linear-gradient(135deg, rgba(0, 194, 255, 0.1), rgba(157, 110, 255, 0.1));
      border-color: rgba(0, 194, 255, 0.3);
    }
    
    .rec-rank {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg);
      border-radius: 50%;
      font-size: 0.9rem;
      font-weight: 700;
      color: var(--c-text2);
    }
    
    .rec-rank.top {
      background: linear-gradient(135deg, #ffd93d, #ff8f3c);
      color: #000;
    }
    
    .rec-content {
      flex: 1;
    }
    
    .rec-time {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--c-text);
      margin-bottom: 4px;
    }
    
    .rec-details {
      display: flex;
      gap: 1rem;
      margin-bottom: 6px;
    }
    
    .rec-stress {
      font-size: 0.85rem;
      color: #00e5a0;
    }
    
    .rec-confidence {
      font-size: 0.85rem;
      color: var(--c-text2);
    }
    
    .rec-reason {
      font-size: 0.85rem;
      color: var(--c-text);
      opacity: 0.8;
    }
    
    .rec-badge {
      padding: 6px 12px;
      background: linear-gradient(135deg, #ffd93d, #ff8f3c);
      color: #000;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 6px;
    }
    
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--c-text2);
    }
    
    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-banner .hint {
      font-size: 0.85rem;
      opacity: 0.85;
      margin-top: 0.75rem;
    }
    
    .zones-section {
      margin-top: 3rem;
    }
    
    .zones-title {
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--c-text);
      margin-bottom: 0.5rem;
    }
    
    .zones-subtitle {
      color: var(--c-text2);
      margin-bottom: 1.5rem;
    }
    
    .zones-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
    }
    
    .zone-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
      border-left: 3px solid;
    }
    
    .zone-card.low { border-left-color: #00e5a0; }
    .zone-card.medium { border-left-color: #ffaa00; }
    .zone-card.high { border-left-color: #ff4d6a; }
    
    .zone-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .zone-header h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--c-text);
    }
    
    .zone-badge {
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .zone-badge.low { background: rgba(0, 229, 160, 0.15); color: #00e5a0; }
    .zone-badge.medium { background: rgba(255, 170, 0, 0.15); color: #ffaa00; }
    .zone-badge.high { background: rgba(255, 77, 106, 0.15); color: #ff4d6a; }
    
    .zone-stats {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
    }
    
    .stat {
      display: flex;
      flex-direction: column;
    }
    
    .stat-value {
      font-size: 1.3rem;
      font-weight: 700;
      color: var(--c-text);
    }
    
    .stat-label {
      font-size: 0.8rem;
      color: var(--c-text2);
    }
    
    .zone-lines {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    
    .line {
      padding: 4px 8px;
      background: var(--bg);
      border-radius: 6px;
      font-size: 0.8rem;
      color: var(--c-text2);
    }
  `]
})
export class ClientRecommendationsComponent {
  loading = false;
  searched = false;
  errorMsg: string | null = null;
  recommendations: ClientRecVm[] = [];
  formData = {
    city: 'Paris',
    user_category: 'metro',
    mobility_profile: 'Low Stress',
    top_n: 5
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  formatStress(rec: ClientRecVm): string {
    if (rec.stressNum == null || Number.isNaN(rec.stressNum)) {
      return 'N/A';
    }
    return `${rec.stressNum.toFixed(1)}/5`;
  }

  search(): void {
    this.loading = true;
    this.searched = true;
    this.errorMsg = null;
    this.cdr.markForCheck();

    this.api.getRecommendations(this.formData).subscribe({
      next: (data: any) => {
        const list = data?.recommendations ?? data?.recs ?? data?.items ?? [];
        this.recommendations = Array.isArray(list)
          ? list.map((row: any, i: number) => this.mapApiRow(row, i, data))
          : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.recommendations = [];
        this.errorMsg =
          typeof err === 'string'
            ? err
            : err?.error?.message ||
              err?.message ||
              'Impossible de joindre le service de recommandations.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Aligné sur stress-recommend : City, Avg_Stress, User_Category, Mobility_Profile, N_Records…
   * + champs optionnels time, stress_level, confidence, reason si le backend les envoie déjà.
   */
  private mapApiRow(rec: any, index: number, response: any): ClientRecVm {
    if (!rec || typeof rec !== 'object') {
      return {
        time: `Créneau ${index + 1}`,
        stressNum: null,
        confidence: 0,
        reason: 'Donnée invalide reçue du serveur.'
      };
    }

    const city = rec.City ?? rec.city ?? this.formData.city ?? '';
    const cat = (rec.User_Category ?? rec.user_category ?? this.formData.user_category ?? '').toString();
    const profile = rec.Mobility_Profile ?? rec.mobility_profile ?? this.formData.mobility_profile ?? '';
    const nRecords = Number(rec.N_Records ?? rec.n_records ?? rec.records ?? 0);

    const rawStress =
      rec.Avg_Stress ?? rec.avg_stress ?? rec.stress ?? rec.Stress_Level ?? rec.stress_level;
    let stressNum: number | null = null;
    if (rawStress != null && rawStress !== '') {
      const n = Number(rawStress);
      if (!Number.isNaN(n)) {
        stressNum = n;
      }
    }

    const rawConf = rec.Confidence ?? rec.confidence;
    let confidence: number;
    if (rawConf != null && String(rawConf).trim() !== '') {
      const c = Number(rawConf);
      if (!Number.isNaN(c)) {
        confidence = c > 0 && c <= 1 ? Math.round(c * 100) : c;
      } else {
        confidence = Math.min(
          96,
          70 + Math.min(26, Math.floor(nRecords / 2) + (stressNum != null ? 4 : 0))
        );
      }
    } else {
      confidence = Math.min(
        96,
        70 + Math.min(26, Math.floor(nRecords / 2) + (stressNum != null ? 4 : 0))
      );
    }

    const hour = rec.Hour ?? rec.hour ?? rec.Peak_Hour ?? rec.peak_hour;
    let time =
      rec.time ??
      rec.Time_Slot ??
      rec.time_slot ??
      rec.creneau ??
      '';
    if (!time && hour != null && hour !== '') {
      const h = Number(hour);
      if (!Number.isNaN(h)) {
        time = `Créneau ~${h}h – ${h + 1}h`;
      }
    }
    if (!time) {
      const parts = [city, cat].filter(Boolean);
      time = parts.length ? parts.join(' · ') : `Option ${index + 1}`;
    }

    let reason =
      rec.reason ??
      rec.Reason ??
      rec.explanation ??
      '';
    if (!reason) {
      const glob = response?.global_avg_stress ?? response?.globalAvg ?? response?.avgStress;
      const best = response?.best_stress_found ?? response?.bestStress ?? response?.minStress;
      let extra = '';
      if (glob != null && best != null) {
        extra = ` Réduction vs moyenne globale (${Number(glob).toFixed(2)} → ${Number(best).toFixed(2)}).`;
      }
      reason =
        nRecords > 0
          ? `Basé sur ${nRecords} observation(s) — ${profile}, ${cat}${city ? `, ${city}` : ''}.${extra}`
          : `Combinaison optimisée pour profil « ${profile} » et mode ${cat}${city ? ` (${city})` : ''}.${extra}`;
    }

    return {
      time,
      stressNum,
      confidence: Math.round(confidence) || 0,
      reason
    };
  }
}