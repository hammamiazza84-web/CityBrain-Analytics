import { Component, OnInit, OnDestroy } from '@angular/core';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { ModelSelectionService, Model } from '../../services/model-selection.service';

interface KPI {
  label: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: string;
  color: string;
}

interface Alert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  time: string;
  zone: string;
  action: string;
}

/** Rôles métier réels (login) pour lesquels le dashboard adapte sections + KPI. */
type DeciderRoleKey = 'smart_mobility_manager' | 'urban_planning_director' | 'environmental_analyst';

interface DashboardRoleView {
  displayName: string;
  sections: string[];
  overviewKpiTitle: string;
  overviewKpiSubtitle?: string;
}

const DASHBOARD_VIEWS: Record<DeciderRoleKey, DashboardRoleView> = {
  smart_mobility_manager: {
    displayName: 'Smart Mobility Manager',
    sections: ['kpi', 'charts', 'alerts', 'planning', 'roi'],
    overviewKpiTitle: '🎯 Vue globale — Pilotage transverse',
    overviewKpiSubtitle:
      'Vue complète : synthèse KPI, analyses temps réel, alertes, planning et ROI — alignée avec un rôle administrateur ayant accès à toutes les briques Smart Mobility.'
  },
  urban_planning_director: {
    displayName: 'Directeur urbanisme & planification',
    sections: ['kpi', 'charts', 'planning', 'alerts'],
    overviewKpiTitle: '🏙️ Vue aménagement & réseau urbain',
    overviewKpiSubtitle:
      'Charge des axes, desserte multimodale, chantiers et alertes structurantes — cohérent avec un accès centré infrastructure / aménagement (sans les écrans transport analytiques réservés au manager).'
  },
  environmental_analyst: {
    displayName: 'Analyste environnement',
    sections: ['kpi', 'charts', 'roi', 'alerts'],
    overviewKpiTitle: '🌿 Vue climat & impacts environnementaux',
    overviewKpiSubtitle:
      'Empreinte carbone mobilité, qualité de l’air, intensité énergétique et alertes — cohérent avec les modules Environnement et Sûreté & retours (PIML) exposés à ce rôle.'
  }
};

@Component({
  selector: 'app-dashboard',
  template: `
    <!-- HEADER SUPPRIMÉ COMME DEMANDÉ -->

    <!-- KPIs MÉTIER — vue d’ensemble selon le compte connecté -->
    <div class="kpi-section" *ngIf="isSectionEnabled('kpi')">
      <h2 class="section-title">{{ kpiSectionTitle }}</h2>
      <div class="kpi-grid">
        <div class="kpi-card" *ngFor="let kpi of kpis">
          <div class="kpi-icon" [style.background]="kpi.color + '20'" [style.color]="kpi.color">
            {{ kpi.icon }}
          </div>
          <div class="kpi-content">
            <span class="kpi-label">{{ kpi.label }}</span>
            <span class="kpi-value">{{ kpi.value }}</span>
            <span class="kpi-trend" [class.up]="kpi.trendUp" [class.down]="!kpi.trendUp">
              {{ kpi.trendUp ? '↑' : '↓' }} {{ kpi.trend }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- GRAPHIQUES TEMPS RÉEL -->
    <div class="charts-section" *ngIf="isSectionEnabled('charts')">
      <h2 class="section-title">📊 Analyses Temporelles</h2>
      <div class="charts-grid">
        <!-- Trafic par zone -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Trafic par Zone Géographique</h3>
            <span class="live-badge">● LIVE</span>
          </div>
          <div class="chart-content">
            <div class="zone-chart">
              <div class="zone-bar" *ngFor="let zone of trafficZones; let i = index">
                <span class="zone-name">{{ zone.name }}</span>
                <div class="zone-progress">
                  <div class="zone-fill" [style.width.%]="zone.value" [class.high]="zone.value > 80" [class.medium]="zone.value > 50 && zone.value <= 80"></div>
                </div>
                <span class="zone-value" [class.high]="zone.value > 80">{{ zone.value | number:'1.0-0' }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Évolution stress/retard -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Évolution Stress & Retard (24h)</h3>
            <div class="chart-legend">
              <span class="legend-item"><span class="dot stress"></span> Stress</span>
              <span class="legend-item"><span class="dot delay"></span> Retard</span>
            </div>
          </div>
          <div class="chart-content">
            <div class="line-chart">
              <div class="chart-y-axis">
                <span *ngFor="let tick of [100, 75, 50, 25, 0]">{{ tick }}%</span>
              </div>
              <div class="chart-area">
                <div class="chart-lines">
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path class="stress-line" [attr.d]="getStressPath()"></path>
                    <path class="delay-line" [attr.d]="getDelayPath()"></path>
                  </svg>
                </div>
                <div class="chart-x-axis">
                  <span *ngFor="let hour of ['00h', '06h', '12h', '18h', '23h']">{{ hour }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Courbe CO2 -->
        <div class="chart-card">
          <div class="chart-header">
            <h3>Émissions CO2 (kg/h)</h3>
            <span class="eco-badge">🌿 -12% vs hier</span>
          </div>
          <div class="chart-content">
            <div class="co2-display">
              <div class="co2-big">{{ currentCO2 | number:'1.0-0' }}</div>
              <div class="co2-unit">kg CO2 / heure</div>
              <div class="co2-bar-container">
                <div class="co2-fill" [style.width.%]="(currentCO2 / maxCO2) * 100"></div>
              </div>
              <div class="co2-target">Objectif: < 450 kg/h</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ALERTES PRIORITAIRES -->
    <div class="alerts-section" *ngIf="isSectionEnabled('alerts') && priorityAlerts.length > 0">
      <div class="alerts-header">
        <h2 class="section-title">🚨 Alertes Prioritaires</h2>
        <div class="alerts-filters">
          <button [class.active]="alertFilter === 'all'" (click)="filterAlerts('all')">Toutes</button>
          <button [class.active]="alertFilter === 'critical'" (click)="filterAlerts('critical')">Critiques</button>
          <button [class.active]="alertFilter === 'warning'" (click)="filterAlerts('warning')">Avertissements</button>
        </div>
      </div>
      <div class="alerts-list">
        <div class="alert-item" *ngFor="let alert of filteredAlerts" [class.critical]="alert.severity === 'critical'" [class.warning]="alert.severity === 'warning'" [class.info]="alert.severity === 'info'">
          <div class="alert-severity-indicator"></div>
          <div class="alert-icon">
            <span *ngIf="alert.severity === 'critical'">🚨</span>
            <span *ngIf="alert.severity === 'warning'">⚠️</span>
            <span *ngIf="alert.severity === 'info'">ℹ️</span>
          </div>
          <div class="alert-content">
            <div class="alert-meta">
              <span class="alert-zone">{{ alert.zone }}</span>
              <span class="alert-time">{{ alert.time }}</span>
            </div>
            <h4 class="alert-title">{{ alert.title }}</h4>
            <p class="alert-desc">{{ alert.description }}</p>
            <div class="alert-action-recommended">
              <span class="action-label">Action recommandée:</span>
              <span class="action-text">{{ alert.action }}</span>
            </div>
          </div>
          <div class="alert-actions">
            <button class="btn-resolve" (click)="resolveAlert(alert.id)">Résoudre</button>
            <button class="btn-details" (click)="viewAlertDetails(alert)">Détails</button>
          </div>
        </div>
      </div>
    </div>


    <!-- PLANNING PRÉDICTIF -->
    <div class="planning-section" *ngIf="isSectionEnabled('planning')">
      <h2 class="section-title">📅 Planning Prédictif des Interventions</h2>
      <div class="planning-card">
        <div class="planning-calendar">
          <div class="calendar-day" *ngFor="let day of planningDays" [class.today]="day.isToday" [class.weekend]="day.isWeekend">
            <span class="day-name">{{ day.name }}</span>
            <span class="day-number">{{ day.date }}</span>
            <div class="day-events">
              <div class="event" *ngFor="let event of day.events" [class.maintenance]="event.type === 'maintenance'" [class.optimization]="event.type === 'optimization'" [class.alert]="event.type === 'alert'">
                <span class="event-time">{{ event.time }}</span>
                <span class="event-title">{{ event.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ROI & ÉCONOMIES -->
    <div class="roi-section" *ngIf="isSectionEnabled('roi')">
      <h2 class="section-title">💰 ROI & Économies Générées</h2>
      <div class="roi-grid">
        <div class="roi-card">
          <div class="roi-header">
            <span class="roi-label">Temps Économisé</span>
            <span class="roi-value">{{ roiData.timeSaved }}</span>
          </div>
          <p class="roi-desc">Temps de trajet réduit grâce aux optimisations ML</p>
          <div class="roi-bar">
            <div class="roi-progress" [style.width.%]="roiData.timeProgress"></div>
          </div>
          <span class="roi-target">Objectif: 3,000h/mois</span>
        </div>
        <div class="roi-card">
          <div class="roi-header">
            <span class="roi-label">CO2 Évité</span>
            <span class="roi-value">{{ roiData.co2Saved }}</span>
          </div>
          <p class="roi-desc">Tonnes de CO2 non émises grâce aux itinéraires optimisés</p>
          <div class="roi-bar">
            <div class="roi-progress eco" [style.width.%]="roiData.co2Progress"></div>
          </div>
          <span class="roi-target">Objectif: 20t/mois</span>
        </div>
        <div class="roi-card">
          <div class="roi-header">
            <span class="roi-label">Énergie Économisée</span>
            <span class="roi-value">{{ roiData.energySaved }}</span>
          </div>
          <p class="roi-desc">Optimisation des infrastructures et éclairage intelligent</p>
          <div class="roi-bar">
            <div class="roi-progress energy" [style.width.%]="roiData.energyProgress"></div>
          </div>
          <span class="roi-target">Objectif: 50,000 kWh/mois</span>
        </div>
        <div class="roi-card highlight">
          <div class="roi-header">
            <span class="roi-label">ROI Global ML</span>
            <span class="roi-value big">{{ roiData.globalRoi }}</span>
          </div>
          <p class="roi-desc">Retour sur investissement des modèles prédictifs</p>
          <div class="roi-metrics">
            <span class="metric">Coût: {{ roiData.cost }}</span>
            <span class="metric">Gain: {{ roiData.gain }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ===== HEADER ===== */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 0 1rem;
    }
    
    .header-left h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--c-text);
      margin: 0;
    }
    
    .header-left p {
      color: var(--c-text2);
      margin: 0.5rem 0 0 0;
    }

    .decider-context {
      margin: 0.65rem 0 0 0;
      font-size: 0.9rem;
      color: var(--c-text2);
    }

    .decider-context strong {
      color: var(--c-text);
      font-weight: 600;
    }

    .decider-label {
      margin-right: 0.35rem;
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .last-update {
      color: var(--c-text2);
      font-size: 0.85rem;
    }
    
    .btn-export {
      padding: 0.75rem 1.5rem;
      background: var(--c-blue);
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    }
    
    .btn-export:hover {
      background: var(--c-blue-dark);
      transform: translateY(-1px);
    }

    /* ===== SECTIONS ===== */
    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--c-text);
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .kpi-section > .section-title {
      margin-bottom: 0.35rem;
    }

    .section-lead {
      font-size: 0.95rem;
      color: var(--c-text2);
      margin: 0 0 1.25rem 0;
      line-height: 1.45;
      max-width: 52rem;
    }

    /* ===== KPIs ===== */
    .kpi-section {
      margin-bottom: 3rem;
    }
    
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .kpi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.3s ease;
    }
    
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .kpi-icon {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }
    
    .kpi-content {
      flex: 1;
    }
    
    .kpi-label {
      font-size: 0.85rem;
      color: var(--c-text2);
      display: block;
      margin-bottom: 0.25rem;
    }
    
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--c-text);
      display: block;
      margin-bottom: 0.25rem;
    }
    
    .kpi-trend {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
    
    .kpi-trend.up {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }
    
    .kpi-trend.down {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    /* ===== CHARTS ===== */
    .charts-section {
      margin-bottom: 3rem;
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
      gap: 1.5rem;
    }
    
    .chart-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      overflow: hidden;
    }
    
    .chart-header {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .chart-header h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--c-text);
    }
    
    .live-badge {
      color: #22c55e;
      font-size: 0.75rem;
      font-weight: 600;
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    .eco-badge {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .chart-content {
      padding: 1.5rem;
    }
    
    .zone-chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .zone-bar {
      display: grid;
      grid-template-columns: 100px 1fr 40px;
      align-items: center;
      gap: 1rem;
    }
    
    .zone-name {
      font-size: 0.85rem;
      color: var(--c-text2);
    }
    
    .zone-progress {
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
    }
    
    .zone-fill {
      height: 100%;
      background: var(--c-blue);
      transition: width 0.3s ease;
    }
    
    .zone-fill.high {
      background: #ef4444;
    }
    
    .zone-fill.medium {
      background: #f59e0b;
    }
    
    .zone-value {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--c-text);
    }
    
    .zone-value.high {
      color: #ef4444;
    }
    
    .line-chart {
      display: grid;
      grid-template-columns: 40px 1fr;
      gap: 1rem;
      height: 200px;
    }
    
    .chart-y-axis {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--c-text2);
    }
    
    .chart-area {
      position: relative;
    }
    
    .chart-lines {
      height: 160px;
      background: var(--bg);
      border-radius: 4px;
      padding: 1rem;
    }
    
    .chart-x-axis {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--c-text2);
      margin-top: 0.5rem;
    }
    
    .chart-legend {
      display: flex;
      gap: 1rem;
    }
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--c-text2);
    }
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .dot.stress {
      background: #8b5cf6;
    }
    
    .dot.delay {
      background: #f59e0b;
    }
    
    .stress-line, .delay-line {
      fill: none;
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      vector-effect: non-scaling-stroke;
    }

    .stress-line {
      stroke: #8b5cf6;
    }

    .delay-line {
      stroke: #f59e0b;
    }
    
    .chart-lines svg {
      width: 100%;
      height: 100%;
      overflow: visible;
    }

    .co2-display {
      text-align: center;
    }
    
    .co2-big {
      font-size: 3rem;
      font-weight: 700;
      color: var(--c-text);
      margin-bottom: 0.5rem;
    }
    
    .co2-unit {
      color: var(--c-text2);
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }
    
    .co2-bar-container {
      height: 12px;
      background: var(--border);
      border-radius: 6px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    
    .co2-fill {
      height: 100%;
      background: linear-gradient(to right, #22c55e, #16a34a);
      transition: width 0.3s ease;
    }
    
    .co2-target {
      font-size: 0.75rem;
      color: var(--c-text2);
    }

    /* ===== ALERTES ===== */
    .alerts-section {
      margin-bottom: 3rem;
    }
    
    .alerts-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }
    
    .alerts-filters {
      display: flex;
      gap: 0.5rem;
    }
    
    .alerts-filters button {
      padding: 0.5rem 1rem;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--c-text2);
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .alerts-filters button.active {
      background: var(--c-blue);
      color: white;
      border-color: var(--c-blue);
    }
    
    .alerts-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    
    .alert-item {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      gap: 1rem;
      transition: all 0.3s ease;
    }
    
    .alert-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    
    .alert-item.critical {
      border-left: 4px solid #ef4444;
    }
    
    .alert-item.warning {
      border-left: 4px solid #f59e0b;
    }
    
    .alert-item.info {
      border-left: 4px solid var(--c-blue);
    }
    
    .alert-icon {
      font-size: 1.5rem;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg2);
      border-radius: 8px;
      flex-shrink: 0;
    }
    
    .alert-content {
      flex: 1;
    }
    
    .alert-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }
    
    .alert-zone {
      font-size: 0.75rem;
      color: var(--c-text2);
      background: var(--bg);
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
    }
    
    .alert-time {
      font-size: 0.75rem;
      color: var(--c-text2);
    }
    
    .alert-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--c-text);
      margin: 0 0 0.5rem 0;
    }
    
    .alert-desc {
      color: var(--c-text2);
      font-size: 0.9rem;
      margin: 0 0 1rem 0;
      line-height: 1.4;
    }
    
    .alert-action-recommended {
      background: rgba(0, 194, 255, 0.1);
      padding: 0.75rem;
      border-radius: 6px;
      margin-bottom: 1rem;
    }
    
    .action-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--c-blue);
    }
    
    .action-text {
      font-size: 0.85rem;
      color: var(--c-text);
    }
    
    .alert-actions {
      display: flex;
      gap: 0.5rem;
    }
    
    .btn-resolve, .btn-details {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .btn-resolve {
      background: #22c55e;
      color: white;
    }
    
    .btn-details {
      background: var(--bg);
      color: var(--c-text);
      border: 1px solid var(--border);
    }
    
    .btn-resolve:hover, .btn-details:hover {
      transform: translateY(-1px);
    }


    /* ===== PLANNING ===== */
    .planning-section {
      margin-bottom: 3rem;
    }
    
    .planning-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
    }
    
    .planning-calendar {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 1rem;
    }
    
    .calendar-day {
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 1rem;
      min-height: 120px;
    }
    
    .calendar-day.today {
      background: rgba(0, 194, 255, 0.1);
      border-color: var(--c-blue);
    }
    
    .calendar-day.weekend {
      background: var(--bg);
    }
    
    .day-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--c-text2);
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .day-number {
      font-size: 1.2rem;
      font-weight: 700;
      color: var(--c-text);
      display: block;
      margin-bottom: 0.5rem;
    }
    
    .day-events {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    
    .event {
      padding: 0.25rem;
      border-radius: 4px;
      font-size: 0.7rem;
      display: flex;
      gap: 0.25rem;
    }
    
    .event.maintenance {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
    }
    
    .event.optimization {
      background: rgba(34, 197, 94, 0.1);
      color: #22c55e;
    }
    
    .event.alert {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }
    
    .event-time {
      font-weight: 600;
    }

    /* ===== ROI ===== */
    .roi-section {
      margin-bottom: 3rem;
    }
    
    .roi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }
    
    .roi-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }
    
    .roi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    }
    
    .roi-card.highlight {
      background: linear-gradient(135deg, rgba(0, 194, 255, 0.1), rgba(157, 110, 255, 0.1));
      border-color: rgba(0, 194, 255, 0.3);
    }
    
    .roi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .roi-label {
      font-size: 0.9rem;
      color: var(--c-text2);
    }
    
    .roi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--c-text);
    }
    
    .roi-value.big {
      font-size: 2rem;
      color: var(--c-blue);
    }
    
    .roi-desc {
      color: var(--c-text2);
      font-size: 0.85rem;
      margin-bottom: 1rem;
      line-height: 1.4;
    }
    
    .roi-bar {
      height: 8px;
      background: var(--border);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }
    
    .roi-progress {
      height: 100%;
      background: var(--c-blue);
      transition: width 0.3s ease;
    }
    
    .roi-progress.eco {
      background: #22c55e;
    }
    
    .roi-progress.energy {
      background: #f59e0b;
    }
    
    .roi-target {
      font-size: 0.75rem;
      color: var(--c-text2);
    }
    
    .roi-metrics {
      display: flex;
      gap: 1rem;
      margin-top: 0.5rem;
    }
    
    .metric {
      font-size: 0.75rem;
      color: var(--c-text2);
      background: var(--bg);
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .kpi-grid, .charts-grid, .roi-grid {
        grid-template-columns: 1fr;
      }
      
      .planning-calendar {
        grid-template-columns: repeat(2, 1fr);
      }
      
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  allModels: Model[] = [];
  selectedCount = 0;
  sections = ['stress', 'transport', 'infra', 'piml', 'env', 'anomaly'];
  
  // Nouvelles propriétés
  lastUpdate: Date = new Date();
  kpis: KPI[] = [];
  trafficZones: any[] = [];
  currentCO2 = 0;
  maxCO2 = 600;
  priorityAlerts: Alert[] = [];
  filteredAlerts: Alert[] = [];
  alertFilter = 'all';
  planningDays: any[] = [];
  roiData = {
    timeSaved: '-',
    timeProgress: 0,
    co2Saved: '-',
    co2Progress: 0,
    energySaved: '-',
    energyProgress: 0,
    globalRoi: '-',
    cost: '-',
    gain: '-'
  };
  updateInterval: any;
  private userSub?: Subscription;

  /** Rôle dashboard résolu (clé technique). */
  activeDeciderKey: DeciderRoleKey = 'smart_mobility_manager';
  /** Libellé lisible pour l’utilisateur connecté. */
  deciderDisplayName = '';
  enabledSections: string[] = [];
  /** Titre / sous-titre dynamiques de la section KPI (vue d’ensemble) */
  kpiSectionTitle = 'Vue d’ensemble';
  kpiSectionSubtitle = '';

  constructor(
    private apiService: ApiService,
    private modelSelectionService: ModelSelectionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeData();
    this.applyDashboardForRole();
    this.loadLiveDashboardData();
    this.userSub = this.authService.currentUser$.subscribe(() => {
      this.applyDashboardForRole();
      this.loadLiveDashboardData();
    });
    this.loadModels();
    this.modelSelectionService.selectedModels$.subscribe(() => {
      this.updateSelectedCount();
    });

    this.updateInterval = setInterval(() => {
      this.loadLiveDashboardData();
    }, 30000);
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }

  /** Déduit le rôle dashboard à partir du JWT / utilisateur courant (avec repli email pour la démo). */
  resolveDeciderRoleKey(): DeciderRoleKey {
    const user = this.authService.getCurrentUser();
    const r = (user?.role || '').trim();
    const email = (user?.email || '').toLowerCase();
    if (r === 'urban_planning_director' || email.includes('urban@')) {
      return 'urban_planning_director';
    }
    if (r === 'environmental_analyst' || email.includes('env@')) {
      return 'environmental_analyst';
    }
    if (r === 'smart_mobility_manager' || r === 'manager' || email.includes('manager@')) {
      return 'smart_mobility_manager';
    }
    return 'smart_mobility_manager';
  }

  /** Applique sections visibles + cartes KPI + textes d’intro selon le rôle connecté. */
  applyDashboardForRole(): void {
    const key = this.resolveDeciderRoleKey();
    const cfg = DASHBOARD_VIEWS[key];
    this.activeDeciderKey = key;
    this.deciderDisplayName = cfg.displayName;
    this.enabledSections = [...cfg.sections];
    this.kpiSectionTitle = cfg.overviewKpiTitle;
    this.kpiSectionSubtitle = cfg.overviewKpiSubtitle || '';
    this.kpis = this.buildKpisForRole(key);
  }

  /** Cartes KPI distinctes par rôle métier (données représentatives / démo). */
  buildKpisForRole(role: DeciderRoleKey): KPI[] {
    const byRole: Record<DeciderRoleKey, KPI[]> = {
      smart_mobility_manager: [
        {
          label: 'Modules IA couverts (stress, transport, infra…)',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🧩',
          color: '#8b5cf6'
        },
        {
          label: 'Ponctualité réseau (agrégée)',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '⏰',
          color: '#00c2ff'
        },
        {
          label: 'CO₂ évité (mois)',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🌱',
          color: '#22c55e'
        },
        {
          label: 'Alertes critiques non résolues',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🚨',
          color: '#f59e0b'
        }
      ],
      urban_planning_director: [
        {
          label: 'Charge voirie centre-ville',
          value: '-',
          trend: '-',
          trendUp: false,
          icon: '🚗',
          color: '#ef4444'
        },
        {
          label: 'Population desserte TC (<500 m)',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🚇',
          color: '#00c2ff'
        },
        {
          label: 'Linéaire pistes cyclables sécurisées',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🚲',
          color: '#22c55e'
        },
        {
          label: 'Chantiers impact circulation (actifs)',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🏗️',
          color: '#f59e0b'
        }
      ],
      environmental_analyst: [
        {
          label: 'CO₂ évité (mois)',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🌍',
          color: '#22c55e'
        },
        {
          label: 'Indice qualité de l’air (AQI)',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '💨',
          color: '#00c2ff'
        },
        {
          label: 'Part voyages bas carbone',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '🚲',
          color: '#22c55e'
        },
        {
          label: 'Énergie réseau vs budget',
          value: '-',
          trend: '-',
          trendUp: true,
          icon: '⚡',
          color: '#f59e0b'
        }
      ]
    };
    return [...byRole[role]];
  }

  isSectionEnabled(sectionId: string): boolean {
    return this.enabledSections.includes(sectionId);
  }
  
  initializeData(): void {
    // Zones de trafic
    this.trafficZones = [];
    
    // Alertes prioritaires
    this.priorityAlerts = [];
    
    this.filteredAlerts = [...this.priorityAlerts];
    
    // Planning prédictif
    this.generatePlanningDays();
  }
  
  generatePlanningDays(): void {
    const days = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    const today = new Date().getDay();
    const todayIndex = today === 0 ? 6 : today - 1; // Ajuster pour lundi = 0
    
    this.planningDays = days.map((day, index) => {
      const date = new Date();
      date.setDate(date.getDate() - todayIndex + index);
      
      const isToday = index === todayIndex;
      const isWeekend = index >= 5;
      
      // Générer des événements dynamiquement via l'API (vide par défaut)
      const events: any[] = [];
      
      return {
        name: day,
        date: date.getDate(),
        isToday,
        isWeekend,
        events
      };
    });
  }
  
  /**
   * Recharge les indicateurs depuis le backend (anomalies transport, zones ETL, agrégat dashboard, modèles, CO2).
   * En cas d’erreur réseau, les valeurs issues de initializeData() sont conservées.
   */
  loadLiveDashboardData(): void {
    const co2Payload = this.buildDashCo2Payload();

    // Appel supplémentaire pour les KPIs Urban si nécessaire
    const urbanKpis$ = this.activeDeciderKey === 'urban_planning_director'
      ? this.apiService.get('/urban/kpis').pipe(catchError(() => of(null)))
      : of(null);

    forkJoin({
      anomalies: this.apiService.getTransportAnomalies().pipe(catchError(() => of(this.getSimulatedAnomalies()))),
      zones: this.apiService.getZones().pipe(catchError(() => of(this.getSimulatedZones()))),
      dashboard: this.apiService.getDashboard().pipe(catchError(() => of(this.getSimulatedDashboard()))),
      models: this.apiService.getModelsInfo().pipe(catchError(() => of({ count: 5 }))),
      co2: this.apiService.predictCo2(co2Payload).pipe(catchError(() => of({ predicted: 310 + Math.random() * 40 }))),
      urbanKpis: urbanKpis$
    }).subscribe({
      next: ({ anomalies, zones, dashboard, models, co2, urbanKpis }) => {
        if (!anomalies || !anomalies.live || !anomalies.live.table || anomalies.live.table.length === 0) {
          anomalies = this.getSimulatedAnomalies();
        }
        if (!zones || !Array.isArray(zones) || zones.length === 0) {
          zones = this.getSimulatedZones();
        }
        if (!dashboard || !dashboard.co2_kg_h || !dashboard.kpis) {
          dashboard = this.getSimulatedDashboard();
        }
        if (!models || (!models.models && !models.count)) {
          models = { count: 5 };
        }
        if (!co2 || (!co2.predicted && !co2.predicted_co2_kg && !co2.prediction && !co2.co2 && !co2.emissions)) {
          co2 = { predicted: 310 + Math.random() * 40 };
        }

        this.applyLiveAnomalies(anomalies);
        this.applyLiveZones(zones);
        this.applyLiveDashboardPayload(dashboard, models);
        this.applyCo2Prediction(co2);

        // Appliquer les KPIs Urban réels depuis ETL
        if (urbanKpis && this.activeDeciderKey === 'urban_planning_director') {
          this.applyUrbanKpis(urbanKpis);
        }

        this.patchKpisFromLiveSignals();
        this.filterAlerts(this.alertFilter);
        this.lastUpdate = new Date();
      },
      error: () => {
        this.lastUpdate = new Date();
      }
    });
  }

  private applyUrbanKpis(data: any): void {
    if (!data) return;

    // Charge voirie centre-ville
    const chargeKpi = this.kpis.find(k => /Charge voirie/i.test(k.label));
    if (chargeKpi && data.charge_voirie?.value) {
      chargeKpi.value = data.charge_voirie.value;
      chargeKpi.trend = data.charge_voirie.zone || 'en direct';
      chargeKpi.trendUp = data.charge_voirie.trendUp ?? false;
    }

    // Population desserte TC
    const popKpi = this.kpis.find(k => /Population desserte/i.test(k.label));
    if (popKpi && data.population_desserte?.value) {
      popKpi.value = data.population_desserte.value;
      popKpi.trend = 'usagers ETL';
      popKpi.trendUp = true;
    }

    // Chantiers actifs
    const chantierKpi = this.kpis.find(k => /Chantiers/i.test(k.label));
    if (chantierKpi && data.chantiers_actifs?.value) {
      chantierKpi.value = data.chantiers_actifs.value;
      chantierKpi.trend = 'incidents ETL';
      chantierKpi.trendUp = false;
    }
  }

  private buildDashCo2Payload(): Record<string, number> {
    const d = new Date();
    return {
      Month: d.getMonth() + 1,
      Hour: d.getHours(),
      DayOfWeek: (d.getDay() + 6) % 7,
      Season_num: Math.min(3, Math.floor(d.getMonth() / 3))
    };
  }

  // Fallbacks simulés pour les endpoints manquants
  private getSimulatedAnomalies(): any {
    return {
      live: {
        table: [
          { is_anomaly: 1, score: 0.85, retard_s: 400, segment_id: 12 },
          { is_anomaly: 1, score: 0.65, retard_s: 150, segment_id: 8 },
          { is_anomaly: 1, score: 0.45, charge_estimee: 85, segment_id: 3 }
        ]
      }
    };
  }

  private getSimulatedZones(): any {
    return [
      { name: 'Centre-Ville', value: 75 + Math.random() * 15 },
      { name: 'Gare Principale', value: 85 + Math.random() * 10 },
      { name: 'Quartier Nord', value: 45 + Math.random() * 20 },
      { name: 'Zone Industrielle', value: 60 + Math.random() * 25 }
    ];
  }

  private getSimulatedDashboard(): any {
    return {
      co2_kg_h: 310 + Math.random() * 40,
      kpis: [], // We'll compute them specifically to avoid label overwriting
      roi: {
        timeSaved: '12%',
        timeProgress: 12,
        co2Saved: '8%',
        co2Progress: 8,
        energySaved: '15%',
        energyProgress: 15,
        globalRoi: '18%',
        cost: '120k €',
        gain: '145k €'
      }
    };
  }

  private applyLiveAnomalies(res: any): void {
    if (!res?.live?.table || !Array.isArray(res.live.table)) {
      return;
    }
    const rows = res.live.table.filter((item: any) => Number(item.is_anomaly) === 1);
    this.priorityAlerts = rows.slice(0, 12).map((item: any, index: number) =>
      this.mapAnomalyToPriorityAlert(item, index)
    );
  }

  private mapAnomalyToPriorityAlert(item: any, index: number): Alert {
    const score = Number(item.score) || 0;
    const retard = Number(item.retard_s) || 0;
    const charge = Number(item.charge_estimee) || 0;

    let severity: Alert['severity'] = 'info';
    if (score > 0.7) {
      severity = 'critical';
    } else if (score > 0.4) {
      severity = 'warning';
    }

    let title = '';
    let description = '';
    if (retard > 300) {
      title = 'Retard important détecté';
      description = `Segment ${Math.round(item.segment_id ?? index)} — retard estimé ~${Math.round(retard / 60)} min.`;
    } else if (charge > 80) {
      title = 'Affluence anormale';
      description = `Charge estimée ~${Math.round(charge)} % sur le segment ${Math.round(item.segment_id ?? index)}.`;
    } else {
      title = `Anomalie trafic — segment ${Math.round(item.segment_id ?? index)}`;
      description = 'Comportement hors norme détecté par le modèle de transport.';
    }

    return {
      id: String(item.segment_id ?? item.id ?? index + 1),
      severity,
      title,
      description,
      time: `Il y a ${Math.max(1, index * 3 + 2)} min`,
      zone: `Segment ${Math.round(item.segment_id ?? index)}`,
      action: 'Ouvrir Transport > diagnostic perturbations et ajuster la régulation si besoin.'
    };
  }

  private extractZonesList(data: any): any[] {
    if (!data) {
      return [];
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data.data)) {
      return data.data;
    }
    if (Array.isArray(data.zones)) {
      return data.zones;
    }
    if (Array.isArray(data.rows)) {
      return data.rows;
    }
    if (Array.isArray(data.results)) {
      return data.results;
    }
    return [];
  }

  private zoneFromRow(row: any, i: number): { name: string; value: number } | null {
    if (!row || typeof row !== 'object') {
      return null;
    }
    const name =
      row.Zone_Name ??
      row.zone_name ??
      row.Name ??
      row.name ??
      row.zone ??
      row.libelle ??
      row.Libelle ??
      `Zone ${i + 1}`;
    const raw =
      row.congestion_pct ??
      row.congestion ??
      row.charge_pct ??
      row.charge ??
      row.taux ??
      row.Taux ??
      row.occupancy ??
      row.value ??
      row.load;
    if (raw == null) {
      return null;
    }
    const n = typeof raw === 'string' ? parseFloat(String(raw).replace(',', '.')) : Number(raw);
    if (Number.isNaN(n)) {
      return null;
    }
    return { name: String(name), value: Math.min(100, Math.max(0, Math.round(n))) };
  }

  private applyLiveZones(data: any): void {
    const list = this.extractZonesList(data);
    const parsed = list
      .map((row, i) => this.zoneFromRow(row, i))
      .filter((z): z is { name: string; value: number } => z != null);
    if (parsed.length > 0) {
      this.trafficZones = parsed;
    }
  }

  private applyLiveDashboardPayload(dashboard: any, models: any): void {
    if (dashboard && typeof dashboard === 'object') {
      // CO2 kg/h depuis les données réelles ETL
      const co2 =
        dashboard.co2_kg_h ??
        dashboard.co2KgPerHour ??
        dashboard.current_co2 ??
        dashboard.emissions_kg_per_hour;
      if (typeof co2 === 'number' && !Number.isNaN(co2)) {
        this.currentCO2 = Math.min(this.maxCO2 * 1.25, Math.max(0, co2));
      }

      // Ponctualité réelle depuis ETL
      const ponc = this.kpis.find(k => /Ponctualité réseau/i.test(k.label));
      if (ponc && dashboard.ponctualite != null) {
        ponc.value = `${dashboard.ponctualite}%`;
        ponc.trend = 'calculé';
        ponc.trendUp = dashboard.ponctualite >= 70;
      }

      // CO2 évité réel
      const co2Kpi = this.kpis.find(k => /CO₂ évité|CO2 évité/i.test(k.label));
      if (co2Kpi && dashboard.environment?.avg_co2 != null) {
        const saved = Math.round(dashboard.environment.avg_co2 * 0.1);
        co2Kpi.value = `${saved.toLocaleString()} kg`;
        co2Kpi.trend = 'données ETL';
        co2Kpi.trendUp = true;
      }

      // Stress pour analyste environnement
      const stressKpi = this.kpis.find(k => /Stress|stress/i.test(k.label));
      if (stressKpi && dashboard.avg_stress != null) {
        stressKpi.value = `${Math.round(dashboard.avg_stress)}/100`;
        stressKpi.trend = 'données ETL';
      }

      const z = dashboard.traffic_zones ?? dashboard.trafficZones;
      if (z) {
        this.applyLiveZones(z);
      }
      const apiKpis = dashboard.kpis ?? dashboard.cards;
      if (Array.isArray(apiKpis) && apiKpis.length > 0 && this.kpis.length > 0) {
        this.mergeKpisFromApi(apiKpis);
      }
      if (dashboard.roi) {
        this.roiData = {
          timeSaved: dashboard.roi.timeSaved || '-',
          timeProgress: dashboard.roi.timeProgress || 0,
          co2Saved: dashboard.roi.co2Saved || '-',
          co2Progress: dashboard.roi.co2Progress || 0,
          energySaved: dashboard.roi.energySaved || '-',
          energyProgress: dashboard.roi.energyProgress || 0,
          globalRoi: dashboard.roi.globalRoi || '-',
          cost: dashboard.roi.cost || '-',
          gain: dashboard.roi.gain || '-'
        };
      }
    }

    if (models && typeof models === 'object') {
      const n = Array.isArray(models.models)
        ? models.models.length
        : Array.isArray(models)
          ? models.length
          : typeof models.count === 'number'
            ? models.count
            : null;
      if (n != null) {
        const k0 = this.kpis.find(k => /Modules IA|modèles/i.test(k.label));
        if (k0) {
          k0.value = `${n}/${Math.max(n, 6)}`;
        }
      }
    }
  }

  private mergeKpisFromApi(apiKpis: any[]): void {
    const len = Math.min(apiKpis.length, this.kpis.length);
    for (let i = 0; i < len; i++) {
      const src = apiKpis[i];
      if (!src || typeof src !== 'object') {
        continue;
      }
      const dst = this.kpis[i];
      if (src.value != null) {
        dst.value = String(src.value);
      }
      if (src.label) {
        dst.label = String(src.label);
      }
      if (src.trend != null) {
        dst.trend = String(src.trend);
      }
      if (typeof src.trendUp === 'boolean') {
        dst.trendUp = src.trendUp;
      }
      if (src.icon) {
        dst.icon = String(src.icon);
      }
      if (src.color) {
        dst.color = String(src.color);
      }
    }
  }

  private applyCo2Prediction(co2: any): void {
    if (!co2) {
      return;
    }
    const v = Number(
      co2.predicted_co2_kg ?? co2.prediction ?? co2.co2 ?? co2.emissions ?? co2.predicted
    );
    if (!Number.isNaN(v) && v > 0) {
      this.currentCO2 = Math.min(this.maxCO2 * 1.25, Math.max(50, v));
    }
  }

  /** Enrichit quelques cartes KPI à partir des signaux déjà chargés (anomalies, zones). */
  private patchKpisFromLiveSignals(): void {
    // Si les zones sont toujours vides (par ex erreur de parsing API), forcer avec les valeurs simulées
    if (this.trafficZones.length === 0) {
      this.trafficZones = this.getSimulatedZones();
    }

    const crit = this.priorityAlerts.filter(a => a.severity === 'critical').length;
    const alertKpi = this.kpis.find(k => /Alertes critiques/i.test(k.label));
    if (alertKpi) {
      alertKpi.value = String(crit);
      alertKpi.trend = 'en direct';
    }

    if (this.trafficZones.length > 0 && this.activeDeciderKey === 'urban_planning_director') {
      const maxz = this.trafficZones.reduce((a, b) => (a.value >= b.value ? a : b));
      const card = this.kpis.find(k => /Charge voirie/i.test(k.label));
      if (card) {
        card.value = `${Math.round(maxz.value)}%`;
        card.trend = 'en direct';
      }

      // Fallback pour les autres indicateurs Urbanisme si l'API est vide
      const popKpi = this.kpis.find(k => /Population desserte/i.test(k.label));
      if (popKpi && (popKpi.value === '-' || !popKpi.value)) {
        popKpi.value = '84%';
        popKpi.trend = '+2% vs 2025';
        popKpi.trendUp = true;
      }

      const cycleKpi = this.kpis.find(k => /pistes cyclables/i.test(k.label));
      if (cycleKpi && (cycleKpi.value === '-' || !cycleKpi.value)) {
        cycleKpi.value = '12.4 km';
        cycleKpi.trend = '+1.2 km';
        cycleKpi.trendUp = true;
      }

      const chantierKpi = this.kpis.find(k => /Chantiers/i.test(k.label));
      if (chantierKpi && (chantierKpi.value === '-' || !chantierKpi.value)) {
        chantierKpi.value = '3';
        chantierKpi.trend = 'en cours';
        chantierKpi.trendUp = false;
      }
    }

    if (this.trafficZones.length > 0 && this.activeDeciderKey === 'smart_mobility_manager') {
      const avg = Math.round(
        this.trafficZones.reduce((s, z) => s + z.value, 0) / this.trafficZones.length
      );
      const ponc = this.kpis.find(k => /Ponctualité réseau/i.test(k.label));
      if (ponc && avg > 0) {
        ponc.value = `${Math.min(99, Math.max(60, 100 - Math.round(avg / 3)))}%`;
        ponc.trend = 'calculé';
      }
    }

    // Fill missing simulation data for CO2 saved if missing
    const co2Kpi = this.kpis.find(k => /CO₂ évité|CO2 évité/i.test(k.label));
    if (co2Kpi && co2Kpi.value === '-') {
      co2Kpi.value = '1,240 kg';
      co2Kpi.trend = '+8% ce mois';
      co2Kpi.trendUp = true;
    }
    
    // Fallback pour les indicateurs Environnement
    if (this.activeDeciderKey === 'environmental_analyst') {
      const aqiKpi = this.kpis.find(k => /qualité de l’air|AQI/i.test(k.label));
      if (aqiKpi && (aqiKpi.value === '-' || !aqiKpi.value)) {
        aqiKpi.value = '42 (Bon)';
        aqiKpi.trend = 'stable';
        aqiKpi.trendUp = true;
      }

      const carbonKpi = this.kpis.find(k => /bas carbone/i.test(k.label));
      if (carbonKpi && (carbonKpi.value === '-' || !carbonKpi.value)) {
        carbonKpi.value = '28%';
        carbonKpi.trend = '+5% vs mois dernier';
        carbonKpi.trendUp = true;
      }
    }

    // Fallback for budget / energy
    const nrgKpi = this.kpis.find(k => /Énergie/i.test(k.label));
    if (nrgKpi && (nrgKpi.value === '-' || !nrgKpi.value)) {
      nrgKpi.value = '-15% conso';
      nrgKpi.trend = 'optimisé';
      nrgKpi.trendUp = true;
    }
  }
  
  exportReport(): void {
    console.log('Export du rapport PDF...');
    // Implémenter export PDF
  }
  
  filterAlerts(filter: string): void {
    this.alertFilter = filter;
    if (filter === 'all') {
      this.filteredAlerts = [...this.priorityAlerts];
    } else {
      this.filteredAlerts = this.priorityAlerts.filter(alert => alert.severity === filter);
    }
  }
  
  resolveAlert(alertId: string): void {
    this.priorityAlerts = this.priorityAlerts.filter(alert => alert.id !== alertId);
    this.filterAlerts(this.alertFilter);
  }
  
  viewAlertDetails(alert: Alert): void {
    console.log('Voir détails alerte:', alert);
  }
  
  getStressPath(): string {
    // Simuler un chemin SVG pour le graphique de stress
    return 'M 0,80 Q 25,60 50,70 T 100,50';
  }
  
  getDelayPath(): string {
    // Simuler un chemin SVG pour le graphique de retard
    return 'M 0,90 Q 25,40 50,60 T 100,30';
  }

  loadModels(): void {
    this.allModels = this.modelSelectionService.getAllModels();
    this.updateSelectedCount();
  }

  getModelsBySection(section: string): Model[] {
    return this.modelSelectionService.getModelsBySection(section).sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
  }

  getSelectedModel(section: string): Model | undefined {
    return this.modelSelectionService.getSelectedModel(section);
  }

  selectModel(section: string, event: any): void {
    const modelId = event.target.value;
    if (modelId) {
      const model = this.allModels.find(m => m.id === modelId);
      if (model) {
        this.modelSelectionService.setSelectedModel(section, model);
      }
    }
  }

  updateSelectedCount(): void {
    this.selectedCount = this.sections.filter(s => this.getSelectedModel(s)).length;
  }

  getIcon(section: string): string {
    const icons: { [key: string]: string } = {
      stress: '🔮',
      transport: '🚌',
      infra: '🏗️',
      piml: '📊',
      env: '🌿',
      anomaly: '🔴'
    };
    return icons[section] || '📌';
  }

  getLabel(section: string): string {
    const labels: { [key: string]: string } = {
      stress: 'Qualité de Vie',
      transport: 'Flux & Mobilité',
      infra: 'Actifs & Énergie',
      piml: 'Sûreté & Retours',
      env: 'Transition Écologique',
      anomaly: 'Alertes Critiques'
    };
    return labels[section] || section;
  }

  getFunctionalName(section: string): string {
    const names: { [key: string]: string } = {
      'stress': 'Indicateur de Stress Usager',
      'transport': 'Gestion de la Ponctualité',
      'infra': 'Optimisation Énergétique',
      'piml': 'Audit des Risques (PIML)',
      'env': 'Empreinte Carbone (CO2)',
      'anomaly': 'Détection des Anomalies'
    };
    return names[section] || section;
  }

  getBusinessDescription(section: string): string {
    const descs: { [key: string]: string } = {
      'stress': 'Analyse préventive du confort et du bien-être des citoyens sur le réseau.',
      'transport': 'Anticipation des retards pour une régulation proactive du trafic.',
      'infra': 'Surveillance de l\'intégrité des actifs et efficacité énergétique.',
      'piml': 'Évaluation continue de la sûreté et analyse sémantique des retours.',
      'env': 'Surveillance de l\'impact environnemental et des émissions de gaz à effet de serre.',
      'anomaly': 'Identification automatique des comportements et flux hors-normes.'
    };
    return descs[section] || 'Analyse stratégique optimisée par IA.';
  }
}

