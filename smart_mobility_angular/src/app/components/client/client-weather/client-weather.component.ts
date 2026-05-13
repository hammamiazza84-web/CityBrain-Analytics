import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-weather',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
        <!-- HEADER UNIFIÉ -->
        <div class="dashboard-header">
          <div class="header-main">
            <h1>🌦️ Smart Mobility Weather</h1>
            <p>Analyse prédictive et conditions en temps réel</p>
          </div>
          
          <div class="weather-search-container">
            <div class="search-input-wrapper">
              <span class="search-icon">🔍</span>
              <input type="text" 
                     [(ngModel)]="city" 
                     (input)="onSearchInput(city)"
                     placeholder="Rechercher une ville (ex: Tunis, Paris...)"
                     class="main-weather-search">
              
              <!-- Autocomplete -->
              <div class="search-results-list" *ngIf="searchResults.length > 0">
                <div class="search-result-item" *ngFor="let item of searchResults" (click)="selectCity(item)">
                  <img [src]="getFlagUrl(item.country)" class="flag-icon">
                  <div class="res-info">
                    <span class="res-name">{{ item.name }}</span>
                    <span class="res-geo" *ngIf="item.state">{{ item.state }}, </span>
                    <span class="res-geo">{{ item.country }}</span>
                  </div>
                </div>
              </div>
            </div>
            <button (click)="refreshAllData()" class="refresh-main-btn" [class.is-loading]="refreshing">
              <span class="btn-icon">{{ refreshing ? '⏳' : '🔄' }}</span>
              {{ refreshing ? 'Actualisation...' : 'Actualiser' }}
            </button>
          </div>
        </div>

        <!-- GRILLE PRINCIPALE (MÉTÉO ACTUELLE & IMPACTS) -->
        <div class="weather-dashboard-grid">
          
          <!-- Carte Météo Actuelle -->
          <div class="weather-hero" *ngIf="realtimeWeatherData">
            <div class="hero-glass"></div>
            <div class="hero-top">
              <div class="location-box">
                <h2>{{ realtimeWeatherData.city }}</h2>
                <span class="update-time">Actualisé à {{ lastRefresh }}</span>
              </div>
              <div class="live-badge">LIVE</div>
            </div>
            
            <div class="hero-main-info">
              <div class="temp-display">
                <span class="degrees">{{ realtimeWeatherData.temperature }}°C</span>
                <div class="cond-box">
                  <span class="cond-icon">{{ realtimeWeatherData.icon }}</span>
                  <span class="cond-text">{{ realtimeWeatherData.condition }}</span>
                </div>
              </div>
              
              <div class="quick-stats">
                <div class="q-stat">
                  <span class="q-icon">💧</span>
                  <div class="q-vals">
                    <span class="q-val">{{ realtimeWeatherData.humidity }}%</span>
                    <span class="q-lbl">Humidité</span>
                  </div>
                </div>
                <div class="q-stat">
                  <span class="q-icon">💨</span>
                  <div class="q-vals">
                    <span class="q-val">{{ realtimeWeatherData.wind }}</span>
                    <span class="q-lbl">Vent</span>
                  </div>
                </div>
                <div class="q-stat">
                  <span class="q-icon">👁️</span>
                  <div class="q-vals">
                    <span class="q-val">{{ realtimeWeatherData.visibility }}km</span>
                    <span class="q-lbl">Visibilité</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="hero-extra" *ngIf="realtimeWeatherData.sunrise">
              <span>🌅 Lever: {{ realtimeWeatherData.sunrise }}</span>
              <span>🌇 Coucher: {{ realtimeWeatherData.sunset }}</span>
              <span class="source-tag">Source: {{ realtimeWeatherData.source }}</span>
            </div>
          </div>

          <!-- Carte Impact & Conseils -->
          <div class="mobility-intelligence-card" *ngIf="realtimeWeatherData">
            <div class="card-head">
              <h3>🧠 Intelligence Mobilité</h3>
            </div>
            
            <div class="impact-alert-box" [class]="getWeatherAlertLevel(realtimeWeatherData.condition_en)">
              <div class="alert-icon-circle">⚠️</div>
              <div class="alert-msg">
                <strong>{{ realtimeWeatherData.condition }}</strong>
                <p>{{ getWeatherImpact(realtimeWeatherData.condition_en) }}</p>
              </div>
            </div>

            <div class="detailed-impacts">
              <div class="impact-row" *ngFor="let impact of getDynamicImpacts() | slice:0:3">
                <div class="row-info">
                  <span class="row-icon">{{ impact.icon }}</span>
                  <span class="row-title">{{ impact.title }}</span>
                  <span class="row-level" [class]="impact.level">{{ impact.level }}</span>
                </div>
                <div class="progress-track">
                  <div class="progress-fill" [style.width.%]="impact.level === 'high' ? 90 : impact.level === 'medium' ? 50 : 20" [class]="impact.level"></div>
                </div>
                <span class="row-msg">{{ impact.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- PRÉVISIONS 5 JOURS -->
        <div class="forecast-unified-section">
          <div class="section-header">
            <h3>📅 Prévisions 5 Jours</h3>
          </div>
          <div class="forecast-list-horizontal">
            <div class="forecast-mini-card" *ngFor="let day of forecastData">
              <span class="f-date">{{ day.date | date:'EEE dd' }}</span>
              <span class="f-icon">{{ day.icon }}</span>
              <span class="f-temp">
                <span class="t-max">{{ day.temperature_max }}°</span>
                <span class="t-min">{{ day.temperature_min }}°</span>
              </span>
              <span class="f-desc">{{ day.condition }}</span>
              <div class="f-impact-tag" [class]="getWeatherAlertLevel(day.condition_en)">
                Impact: {{ impactLevels[day.condition_en] || 'Normal' }}
              </div>
            </div>
          </div>
        </div>

        <!-- ÉTAT DES TRANSPORTS -->
        <div class="transport-unified-section">
          <div class="section-header">
            <h3>🚌 Transports & Retards ({{ city }})</h3>
          </div>
          <div class="transport-flex-grid">
            <div class="transport-item-card" *ngFor="let delay of getTransportDelays()">
              <div class="line-info">
                <span class="line-id">{{ delay.line }}</span>
                <div class="status-indicator">
                  <span class="status-dot-pulse" [class]="delay.status"></span>
                  <span class="status-text">{{ delay.status }}</span>
                </div>
              </div>
              <div class="delay-info">
                <span class="delay-clock">⏱️</span>
                <span class="delay-val">{{ delay.delay }}</span>
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
      overflow-x: hidden;
      isolation: isolate;
    }
    /* Même visuel « train / ville » que les autres pages client */
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
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 1.5rem;
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 2.5rem;
      gap: 2rem;
      flex-wrap: wrap;
    }
    .header-main h1 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--c-text);
      margin-bottom: 0.5rem;
    }
    .header-main p { color: var(--c-text2); font-size: 1.1rem; }

    .weather-search-container {
      display: flex;
      gap: 0.75rem;
      flex: 1;
      max-width: 500px;
    }
    .search-input-wrapper {
      position: relative;
      flex: 1;
    }
    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
    }
    .main-weather-search {
      width: 100%;
      padding: 0.85rem 1rem 0.85rem 2.8rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 14px;
      color: var(--c-text);
      font-size: 0.95rem;
      transition: all 0.3s ease;
    }
    .main-weather-search:focus {
      outline: none;
      border-color: #38bdf8;
      box-shadow: 0 0 20px rgba(56, 189, 248, 0.2);
      background: var(--bg2);
    }

    .refresh-main-btn {
      padding: 0 1.5rem;
      background: linear-gradient(135deg, #0284c7, #0369a1);
      color: white;
      border: none;
      border-radius: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.6rem;
      transition: all 0.3s ease;
      white-space: nowrap;
    }
    .refresh-main-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(2, 132, 199, 0.3);
    }
    .refresh-main-btn.is-loading { opacity: 0.7; cursor: wait; }

    .search-results-list {
      position: absolute;
      top: 100%; left: 0; right: 0;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      margin-top: 8px;
      z-index: 1000;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    .search-result-item {
      padding: 0.75rem 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: background 0.2s;
    }
    .search-result-item:hover { background: rgba(56, 189, 248, 0.1); }
    .flag-icon { width: 24px; border-radius: 3px; }
    .res-info .res-name { display: block; font-weight: 600; font-size: 0.9rem; color: var(--c-text); }
    .res-info .res-geo { font-size: 0.75rem; color: var(--c-text2); }

    .weather-dashboard-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }

    .weather-hero {
      position: relative;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.22), var(--card));
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 2rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 320px;
    }
    .hero-glass {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 100% 0%, rgba(56, 189, 248, 0.15), transparent 50%);
      pointer-events: none;
    }
    .hero-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 1;
    }
    .location-box h2 { font-size: 2rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--c-text); }
    .update-time { font-size: 0.85rem; color: var(--c-text2); }
    .live-badge {
      background: #ef4444;
      color: white;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 1px;
      animation: pulse 2s infinite;
    }

    .hero-main-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 2rem;
      z-index: 1;
    }
    .temp-display { display: flex; align-items: center; gap: 1.5rem; }
    .degrees { font-size: 5rem; font-weight: 800; line-height: 1; color: var(--c-text); }
    .cond-box { display: flex; flex-direction: column; align-items: center; }
    .cond-icon { font-size: 3.5rem; margin-bottom: -0.5rem; }
    .cond-text { font-size: 1.1rem; font-weight: 600; color: var(--c-text); }

    .quick-stats {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .q-stat { display: flex; align-items: center; gap: 0.75rem; }
    .q-icon { font-size: 1.5rem; }
    .q-vals { display: flex; flex-direction: column; }
    .q-val { font-weight: 700; font-size: 1.1rem; color: var(--c-text); }
    .q-lbl { font-size: 0.75rem; color: var(--c-text2); }

    .hero-extra {
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      display: flex;
      gap: 2rem;
      font-size: 0.85rem;
      color: var(--c-text2);
    }
    .source-tag { margin-left: auto; opacity: 0.6; }

    .mobility-intelligence-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }
    .mobility-intelligence-card h3 { font-size: 1.1rem; color: var(--c-text); font-weight: 700; }
    
    .impact-alert-box {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-radius: 16px;
      align-items: center;
    }
    .impact-alert-box.low { background: rgba(34, 197, 94, 0.15); border: 1px solid rgba(34, 197, 94, 0.3); color: #4ade80; }
    .impact-alert-box.medium { background: rgba(234, 179, 8, 0.15); border: 1px solid rgba(234, 179, 8, 0.3); color: #fde047; }
    .impact-alert-box.high { background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #fca5a5; }
    
    .alert-icon-circle {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
    }
    .alert-msg strong { display: block; font-size: 0.95rem; margin-bottom: 2px; }
    .alert-msg p { font-size: 0.8rem; opacity: 0.9; }

    .detailed-impacts { display: flex; flex-direction: column; gap: 1rem; }
    .impact-row { display: flex; flex-direction: column; gap: 0.4rem; }
    .row-info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--c-text); }
    .row-level { margin-left: auto; font-size: 0.7rem; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; }
    .row-level.low { background: #22c55e33; color: #4ade80; }
    .row-level.medium { background: #eab30833; color: #fde047; }
    .row-level.high { background: #ef444433; color: #fca5a5; }

    .progress-track { height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 3px; }
    .progress-fill.low { background: #22c55e; }
    .progress-fill.medium { background: #eab308; }
    .progress-fill.high { background: #ef4444; }
    .row-msg { font-size: 0.75rem; color: var(--c-text2); }

    .forecast-unified-section { margin-bottom: 2.5rem; }
    .section-header h3 { font-size: 1.2rem; margin-bottom: 1.25rem; color: var(--c-text); font-weight: 700; }
    .forecast-list-horizontal {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1rem;
    }
    .forecast-mini-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: all 0.3s;
    }
    .forecast-mini-card:hover { background: var(--bg2); transform: translateY(-5px); border-color: rgba(56, 189, 248, 0.35); }
    .f-date { font-size: 0.8rem; color: var(--c-text2); margin-bottom: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .f-icon { font-size: 2.2rem; margin-bottom: 0.5rem; }
    .f-temp { display: flex; align-items: baseline; gap: 0.4rem; margin-bottom: 0.25rem; }
    .t-max { font-size: 1.5rem; font-weight: 800; color: var(--c-text); }
    .t-min { font-size: 1rem; font-weight: 600; color: var(--c-text2); }
    .f-desc { font-size: 0.85rem; color: var(--c-text2); margin-bottom: 0.75rem; }
    .f-impact-tag {
      font-size: 0.65rem;
      padding: 4px 8px;
      border-radius: 6px;
      font-weight: 700;
    }
    .f-impact-tag.low { background: #22c55e22; color: #4ade80; }
    .f-impact-tag.medium { background: #eab30822; color: #fde047; }
    .f-impact-tag.high { background: #ef444422; color: #fca5a5; }

    .transport-unified-section { margin-bottom: 2.5rem; }
    .transport-flex-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }
    .transport-item-card {
      background: var(--card);
      border-radius: 16px;
      padding: 1rem;
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .line-info { display: flex; justify-content: space-between; align-items: center; }
    .line-id {
      background: var(--bg2);
      color: var(--c-text);
      padding: 2px 10px;
      border-radius: 6px;
      font-weight: 800;
      font-size: 0.85rem;
      border: 1px solid var(--border);
    }
    .status-indicator { display: flex; align-items: center; gap: 0.5rem; }
    .status-dot-pulse { width: 8px; height: 8px; border-radius: 50%; }
    .status-dot-pulse.Stable { background: #22c55e; box-shadow: 0 0 10px #22c55e; }
    .status-dot-pulse.Ralenti { background: #eab308; box-shadow: 0 0 10px #eab308; }
    .status-dot-pulse.Critique { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
    .status-text { font-size: 0.75rem; font-weight: 600; color: var(--c-text2); }
    .delay-info { display: flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; font-weight: 700; color: var(--c-text); }

    @media (max-width: 900px) {
      .weather-dashboard-grid { grid-template-columns: 1fr; }
      .forecast-list-horizontal { grid-template-columns: repeat(3, 1fr); }
    }
    @media (max-width: 600px) {
      .forecast-list-horizontal { grid-template-columns: repeat(2, 1fr); }
      .header-main h1 { font-size: 2rem; }
    }

    @keyframes pulse {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }

    /* Mode clair : cartes météo + alertes (le reste suit --c-text / --card) */
    :host-context(body.light-theme) .weather-hero {
      background: linear-gradient(135deg, rgba(224, 242, 254, 0.9), rgba(255, 255, 255, 0.95));
      border: 1px solid #bae6fd;
    }
    :host-context(body.light-theme) .impact-alert-box.low { color: #166534; }
    :host-context(body.light-theme) .impact-alert-box.medium { color: #854d0e; }
    :host-context(body.light-theme) .impact-alert-box.high { color: #991b1b; }
    :host-context(body.light-theme) .alert-msg strong { color: #0f172a; }
    :host-context(body.light-theme) .alert-msg p { color: #334155; opacity: 1; }
    :host-context(body.light-theme) .row-level.low { color: #15803d; }
    :host-context(body.light-theme) .row-level.medium { color: #a16207; }
    :host-context(body.light-theme) .row-level.high { color: #b91c1c; }
    :host-context(body.light-theme) .progress-track { background: #e2e8f0; }
    :host-context(body.light-theme) .f-impact-tag.low {
      color: #166534;
      background: rgba(34, 197, 94, 0.15);
    }
    :host-context(body.light-theme) .f-impact-tag.medium {
      color: #854d0e;
      background: rgba(234, 179, 8, 0.2);
    }
    :host-context(body.light-theme) .f-impact-tag.high {
      color: #991b1b;
      background: rgba(239, 68, 68, 0.15);
    }
  `]
})
export class ClientWeatherComponent implements OnInit, OnDestroy {
  realtimeWeatherData: any = null;
  city = 'Tunis';
  refreshing = false;
  lastRefresh = '';
  forecastData: any[] = [];
  loading = false;
  
  impactLevels: { [key: string]: string } = {
    'Clear': 'Faible',
    'Clouds': 'Normal',
    'Rain': 'Modéré',
    'Storm': 'Élevé',
    'Snow': 'Critique',
    'Mist': 'Modéré',
    'Fog': 'Élevé'
  };
  
  userLocation: { lat: number; lon: number } | null = null;
  locationError: string | null = null;

  searchQuery = '';
  searchResults: any[] = []
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  
  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    console.log('[WEATHER] Initialisation du dashboard unifié...');
    this.getUserLocation();
    this.initAutocomplete();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initAutocomplete(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) return [[]];
        return this.apiService.searchCities(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(results => {
      this.searchResults = results;
      this.cdr.markForCheck();
    });
  }

  onSearchInput(query: string): void {
    this.searchSubject.next(query);
  }

  selectCity(item: any): void {
    console.log('[SEARCH] Ville sélectionnée:', item);
    this.city = item.name;
    this.searchResults = [];
    
    if (item.lat && item.lon) {
      this.userLocation = { lat: item.lat, lon: item.lon };
    }
    this.refreshAllData();
  }

  refreshAllData(): void {
    this.refreshing = true;
    this.loading = true;
    this.cdr.markForCheck();

    this.loadRealtimeWeather();
    this.loadForecastWeather();
    
    setTimeout(() => {
      this.refreshing = false;
      this.loading = false;
      this.cdr.markForCheck();
    }, 1500);
  }

  getFlagUrl(countryCode: string): string {
    if (!countryCode) return '';
    return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`;
  }
  
  getUserLocation(): void {
    if ('geolocation' in navigator) {
      this.loading = true;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude
          };
          this.locationError = null;
          this.refreshAllData();
        },
        (error) => {
          this.locationError = `Erreur GPS (${error.code})`;
          this.userLocation = null;
          this.refreshAllData();
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      this.locationError = 'Géolocalisation non supportée';
      this.refreshAllData();
    }
  }
  
  loadForecastWeather(): void {
    this.apiService.getWeatherForecast(this.city).subscribe({
      next: (data) => {
        if (data && data.forecast && data.forecast.length > 0) {
          this.forecastData = data.forecast.map((day: any) => ({
            ...day,
            temperature_max: day.temperature_max ?? day.temperature ?? day.temp ?? 0,
            temperature_min: day.temperature_min ?? day.temperature ?? day.temp ?? 0,
            condition: day.condition || 'Inconnu',
            icon: day.icon || '🌡️'
          }));
        } else {
          this.setStaticForecast();
        }
        this.cdr.markForCheck();
      },
      error: () => {
        this.setStaticForecast();
        this.cdr.markForCheck();
      }
    });
  }

  private setStaticForecast(): void {
    this.forecastData = [
      { date: this.formatDate(0), icon: '☀️', temperature_max: 24, temperature_min: 16, condition: 'Ensoleillé', condition_en: 'clear' },
      { date: this.formatDate(1), icon: '⛅', temperature_max: 22, temperature_min: 15, condition: 'Partiellement nuageux', condition_en: 'cloudy' },
      { date: this.formatDate(2), icon: '🌧️', temperature_max: 18, temperature_min: 12, condition: 'Pluvieux', condition_en: 'rain' },
      { date: this.formatDate(3), icon: '⛈️', temperature_max: 20, temperature_min: 14, condition: 'Orageux', condition_en: 'storm' },
      { date: this.formatDate(4), icon: '☁️', temperature_max: 21, temperature_min: 13, condition: 'Nuageux', condition_en: 'overcast' }
    ];
  }

  private formatDate(daysToAdd: number): string {
    const d = new Date();
    d.setDate(d.getDate() + daysToAdd);
    return d.toISOString().split('T')[0];
  }
  
  loadRealtimeWeather(): void {
    if (this.userLocation) {
      this.apiService.getWeatherByCoordinates(this.userLocation.lat, this.userLocation.lon).subscribe({
        next: (data) => {
          this.realtimeWeatherData = data;
          if (data.city && data.city !== 'Votre position') {
            this.city = data.city;
          }
          this.lastRefresh = new Date().toLocaleTimeString();
          this.cdr.markForCheck();
        },
        error: () => {
          this.apiService.getRealtimeWeather(this.city).subscribe(data => {
            this.realtimeWeatherData = data;
            this.lastRefresh = new Date().toLocaleTimeString();
            this.cdr.markForCheck();
          });
        }
      });
    } else {
      this.apiService.getRealtimeWeather(this.city).subscribe(data => {
        this.realtimeWeatherData = data;
        this.lastRefresh = new Date().toLocaleTimeString();
        this.cdr.markForCheck();
      });
    }
  }
  
  getWeatherAlertLevel(condition: string): string {
    const c = condition?.toLowerCase() || '';
    if (c.includes('rain') || c.includes('storm') || c.includes('snow')) return 'high';
    if (c.includes('cloud') || c.includes('mist') || c.includes('fog')) return 'medium';
    if (c.includes('clear')) return 'low';
    return 'medium';
  }

  getWeatherImpact(condition: string): string {
    const c = condition?.toLowerCase() || '';
    if (c.includes('rain') || c.includes('storm')) return 'Risque de retards importants';
    if (c.includes('snow')) return 'Conditions difficiles';
    if (c.includes('cloud')) return 'Service normal';
    if (c.includes('mist') || c.includes('fog')) return 'Visibilité réduite';
    if (c.includes('clear')) return 'Conditions idéales';
    return 'Conditions normales';
  }

  getDynamicImpacts(): any[] {
    const c = this.realtimeWeatherData?.condition_en?.toLowerCase() || '';
    const impacts = [];
    if (c.includes('rain') || c.includes('storm')) {
      impacts.push({ icon: '🚗', title: 'Voiture', message: 'Routes glissantes', level: 'high' });
      impacts.push({ icon: '🚌', title: 'Transport', message: 'Retards probables', level: 'medium' });
      impacts.push({ icon: '🚴', title: 'Vélo', message: 'Déconseillé', level: 'high' });
    } else {
      impacts.push({ icon: '🚗', title: 'Voiture', message: 'Normal', level: 'low' });
      impacts.push({ icon: '🚌', title: 'Transport', message: 'Service normal', level: 'low' });
      impacts.push({ icon: '🚴', title: 'Vélo', message: 'Bonnes conditions', level: 'low' });
    }
    return impacts;
  }

  getTransportDelays(): any[] {
    const c = this.realtimeWeatherData?.condition_en?.toLowerCase() || '';
    const isBad = c.includes('rain') || c.includes('storm');
    return [
      { line: 'Ligne 1', status: isBad ? 'Ralenti' : 'Stable', delay: isBad ? '+8 min' : '0 min' },
      { line: 'Ligne 2', status: isBad ? 'Ralenti' : 'Stable', delay: isBad ? '+12 min' : '0 min' },
      { line: 'Ligne 3', status: 'Stable', delay: '0 min' }
    ];
  }
}
