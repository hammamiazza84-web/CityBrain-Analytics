import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-alerts',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>⚠️ Alertes en Temps Réel</h1>
            <p>Problèmes et anomalies sur le réseau</p>
          </div>
          <div class="header-actions">
            <button class="btn-export-alerts" (click)="exportAlerts()" [disabled]="loading || alerts.length === 0">
              📊 Exporter les Alertes
            </button>
          </div>
        </div>
      </div>
      
      <div class="filters-card">
        <div class="filter-row">
          <div class="filter-group">
            <label>Ville</label>
            <select [(ngModel)]="filters.city" (change)="loadAlerts()">
              <option>Paris</option>
              <option>Lyon</option>
              <option>Marseille</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Ligne</label>
            <select [(ngModel)]="filters.line" (change)="loadAlerts()">
              <option value="">Toutes les lignes</option>
              <option>Métro Ligne 1</option>
              <option>Métro Ligne 4</option>
              <option>Bus 72</option>
              <option>RER A</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Gravité</label>
            <select [(ngModel)]="filters.severity" (change)="loadAlerts()">
              <option value="">Toutes</option>
              <option value="critical">🔴 Critique</option>
              <option value="warning">🟠 Avertissement</option>
              <option value="info">🔵 Info</option>
            </select>
          </div>
          <button class="btn-refresh" (click)="loadAlerts()" [disabled]="loading">
            🔄 {{ loading ? 'Chargement...' : 'Actualiser' }}
          </button>
        </div>
      </div>
      
      <div class="alerts-list">
        <div class="alert-card" *ngFor="let alert of alerts" [class]="alert.type">
          <div class="alert-icon">{{ alert.icon }}</div>
          <div class="alert-content">
            <div class="alert-header">
              <span class="alert-type">{{ alert.type_label }}</span>
              <span class="alert-time">{{ alert.time }}</span>
            </div>
            <h3 class="alert-title">{{ alert.title }}</h3>
            <p class="alert-desc">{{ alert.description }}</p>
            <div class="alert-footer">
              <span class="alert-line">🚇 {{ alert.line }}</span>
              <span class="alert-confidence" *ngIf="alert.confidence">
                Confiance: {{ alert.confidence }}%
              </span>
            </div>
          </div>
          <div class="alert-score" *ngIf="alert.anomaly_score">
            <div class="score-value" [style.color]="getScoreColor(alert.anomaly_score)">
              {{ alert.anomaly_score }}
            </div>
            <div class="score-label">Score</div>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="alerts.length === 0 && !loading">
          <div class="empty-icon">✅</div>
          <h3>Tout va bien !</h3>
          <p>Aucune anomalie détectée sur le réseau actuellement.</p>
        </div>
      </div>
      
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-dot critical"></span>
          <span>{{ stats.critical }} Critiques</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot warning"></span>
          <span>{{ stats.warning }} Avertissements</span>
        </div>
        <div class="stat-item">
          <span class="stat-dot info"></span>
          <span>{{ stats.info }} Informations</span>
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
    
    .filters-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .filter-row { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .filter-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 150px; }
    .filter-group label { font-size: 0.75rem; color: var(--c-text2); font-weight: 500; text-transform: uppercase; }
    .filter-group select {
      padding: 10px 12px; background: var(--bg);
      border: 1px solid var(--border); border-radius: 8px;
      color: var(--c-text); font-size: 0.95rem; cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .filter-group select:focus {
      outline: none; border-color: #00c2ff;
      background: rgba(255,255,255,0.12);
      box-shadow: 0 0 0 3px rgba(0, 194, 255, 0.1);
    }
    
    .filter-group select:hover {
      border-color: rgba(0, 194, 255, 0.5);
      background: rgba(255,255,255,0.1);
    }
    
    .filter-group select option {
      background: var(--bg2); color: var(--c-text);
      padding: 8px 12px; border: none;
    }
    .btn-refresh {
      padding: 10px 20px; background: var(--bg);
      border: 1px solid var(--border); border-radius: 8px;
      color: var(--c-text); font-size: 0.9rem; cursor: pointer;
      transition: all 0.2s ease; white-space: nowrap;
    }
    .btn-refresh:hover:not(:disabled) { background: var(--bg2); border-color: var(--c-blue); }
    .btn-refresh:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .alerts-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1.5rem; }
    
    .alert-card {
      display: flex; gap: 1rem; align-items: flex-start;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 1.25rem;
      transition: all 0.3s ease;
    }
    .alert-card:hover { transform: translateY(-2px); border-color: rgba(255,255,255,0.15); }
    .alert-card.critical { border-left: 3px solid #ff4d6a; }
    .alert-card.warning { border-left: 3px solid #ff8f3c; }
    .alert-card.info { border-left: 3px solid #00c2ff; }
    
    .alert-icon { font-size: 2rem; }
    .alert-content { flex: 1; }
    .alert-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.5rem;
    }
    .alert-type {
      padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
    }
    .alert-card.critical .alert-type { background: rgba(255,77,106,0.2); color: #ff4d6a; }
    .alert-card.warning .alert-type { background: rgba(255,143,60,0.2); color: #ff8f3c; }
    .alert-card.info .alert-type { background: rgba(0,194,255,0.2); color: #00c2ff; }
    .alert-time { font-size: 0.8rem; color: var(--c-text2); opacity: 0.8; }
    .alert-title { font-size: 1.1rem; font-weight: 600; color: var(--c-text); margin-bottom: 0.5rem; }
    .alert-desc { font-size: 0.9rem; color: var(--c-text2); line-height: 1.5; margin-bottom: 0.75rem; }
    .alert-footer { display: flex; gap: 1rem; font-size: 0.8rem; color: var(--c-text2); opacity: 0.8; }
    .alert-line { color: #00c2ff; }
    .alert-score { text-align: center; padding-left: 1rem; border-left: 1px solid var(--border); }
    .score-value { font-size: 1.5rem; font-weight: 700; }
    .score-label { font-size: 0.7rem; color: var(--c-text2); text-transform: uppercase; }
    
    .empty-state {
      text-align: center; padding: 3rem;
      background: rgba(0, 229, 160, 0.05);
      border: 1px solid rgba(0, 229, 160, 0.2);
      border-radius: 12px;
    }
    .empty-icon { font-size: 3rem; margin-bottom: 1rem; }
    .empty-state h3 { color: #00e5a0; font-size: 1.2rem; margin-bottom: 0.5rem; }
    .empty-state p { color: var(--c-text2); font-size: 0.9rem; }
    
    .stats-bar {
      display: flex; justify-content: center; gap: 2rem;
      padding: 1rem; background: var(--card);
      border: 1px solid var(--border);
    }
    .stat-item { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--c-text2); }
    .stat-dot { width: 10px; height: 10px; border-radius: 50%; }
    .stat-dot.critical { background: #ff4d6a; }
    .stat-dot.warning { background: #ff8f3c; }
    .stat-dot.info { background: #00c2ff; }
  `]
})
export class ClientAlertsComponent {
  loading = false;
  filters = { city: 'Paris', line: '', severity: '' };
  alerts: any[] = [];
  stats = { critical: 0, warning: 0, info: 0 };
  
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {
    this.loadAlerts();
  }
  
  loadAlerts(): void {
    this.loading = true;
    this.cdr.markForCheck();

    this.apiService.getTransportAnomalies().subscribe({
      next: (res) => {
        if (res && res.live && res.live.table && res.live.table.length > 0) {
          // Transformer les données de l'API en alertes
          this.alerts = res.live.table
            .filter((item: any) => item.is_anomaly === 1) // Ne garder que les anomalies
            .map((item: any, index: number) => this.mapAnomalyToAlert(item, index))
            .slice(0, 10); // Limiter à 10 alertes

          this.stats = {
            critical: this.alerts.filter(a => a.type === 'critical').length,
            warning: this.alerts.filter(a => a.type === 'warning').length,
            info: this.alerts.filter(a => a.type === 'info').length
          };
        } else {
          // Pas d'anomalies détectées
          this.alerts = [];
          this.stats = { critical: 0, warning: 0, info: 0 };
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur lors du chargement des alertes:', err);
        // En cas d'erreur, afficher un message d'info
        this.alerts = [{
          icon: '⚠️',
          type: 'info',
          type_label: 'INFO',
          title: 'Service temporairement indisponible',
          description: 'Impossible de récupérer les alertes en temps réel. Veuillez réessayer ultérieurement.',
          time: 'Maintenant',
          line: 'Système',
          confidence: null,
          anomaly_score: 0
        }];
        this.stats = { critical: 0, warning: 0, info: 1 };
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  exportAlerts(): void {
    if (this.alerts.length === 0) return;

    // Créer le contenu CSV
    const headers = ['Type', 'Titre', 'Description', 'Temps', 'Ligne', 'Confiance', 'Score Anomalie'];
    const csvContent = [
      headers.join(','),
      ...this.alerts.map(alert => [
        alert.type_label,
        `"${alert.title}"`,
        `"${alert.description}"`,
        alert.time,
        alert.line,
        alert.confidence || 'N/A',
        alert.anomaly_score || 'N/A'
      ].join(','))
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `alertes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private mapAnomalyToAlert(item: any, index: number): any {
    const score = item.score || 0;
    const retard = item.retard_s || 0;
    const charge = item.charge_estimee || 0;

    // Déterminer le type d'alerte basé sur le score d'anomalie
    let type = 'info';
    let typeLabel = 'INFO';
    let icon = '🔵';

    if (score > 0.7) {
      type = 'critical';
      typeLabel = 'CRITIQUE';
      icon = '🚨';
    } else if (score > 0.4) {
      type = 'warning';
      typeLabel = 'AVERTISSEMENT';
      icon = '⚠️';
    }

    // Générer un titre et description basés sur les données
    let title = '';
    let description = '';

    if (retard > 300) { // Plus de 5 minutes de retard
      title = `Retard important détecté`;
      description = `Anomalie sur le segment ${Math.round(item.segment_id || index)}. Retard estimé: ${Math.round(retard/60)} min.`;
    } else if (charge > 80) { // Charge élevée
      title = `Affluence anormale`;
      description = `Charge estimée à ${Math.round(charge)}% sur le segment ${Math.round(item.segment_id || index)}.`;
    } else {
      title = `Anomalie détectée - Segment ${Math.round(item.segment_id || index)}`;
      description = `Comportement anormal du trafic détecté par l'algorithme ML.`;
    }

    return {
      icon: icon,
      type: type,
      type_label: typeLabel,
      title: title,
      description: description,
      time: `Il y a ${Math.max(1, index * 3 + 5)} min`,
      line: `Segment ${Math.round(item.segment_id || index)}`,
      confidence: Math.round((1 - score) * 100),
      anomaly_score: Math.round(score * 100) / 100
    };
  }
  
  getScoreColor(score: number): string {
    if (score > 0.8) return '#ff4d6a';
    if (score > 0.5) return '#ff8f3c';
    return '#00c2ff';
  }
}

// Styles CSS pour le composant
const styles = `
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.header-text h1 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-text, #333);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-text p {
  margin: 0.5rem 0 0 0;
  color: var(--c-text2, #666);
  font-size: 1rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.btn-export-alerts {
  background: linear-gradient(135deg, #00c2ff, #0084ff);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 194, 255, 0.3);
}

.btn-export-alerts:hover:not(:disabled) {
  background: linear-gradient(135deg, #00a8e6, #0066cc);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 194, 255, 0.4);
}

.btn-export-alerts:active:not(:disabled) {
  transform: translateY(0);
}

.btn-export-alerts:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
  box-shadow: none;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }
  
  .btn-export-alerts {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}
`;

// Appliquer les styles au composant
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);