import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, catchError, throwError, timeout, firstValueFrom } from 'rxjs';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-client-routes',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
      <div class="page-header">
        <div class="header-content">
          <div class="header-text">
            <h1>🗺️ Meilleurs Itinéraires</h1>
            <p>Découvrez les zones et créneaux optimaux</p>
          </div>
          <div class="header-actions">
            <button class="btn-save-routes" (click)="saveFavoriteRoutes()" [disabled]="routes.length === 0">
              ⭐ Sauvegarder les Itinéraires
            </button>
          </div>
        </div>
      </div>
      
      <div class="route-planner">
        <div class="planner-inputs">
          <div class="input-group">
            <label>📍 Départ</label>
            <select [(ngModel)]="route.from">
              <option value="">Sélectionnez un arrêt...</option>
              <option *ngFor="let stop of stops" [value]="stop.Stop_Name">{{ stop.Stop_Name }}</option>
            </select>
          </div>
          <div class="input-group">
            <label>🏁 Arrivée</label>
            <select [(ngModel)]="route.to">
              <option value="">Sélectionnez un arrêt...</option>
              <option *ngFor="let stop of stops" [value]="stop.Stop_Name">{{ stop.Stop_Name }}</option>
            </select>
          </div>
          <div class="input-group time-group">
            <label>🕐 Quand</label>
            <select [(ngModel)]="route.when">
              <option value="now">Maintenant</option>
              <option value="peak">Heure de pointe</option>
              <option value="offpeak">Hors pointe</option>
              <option value="morning">Demain matin</option>
            </select>
          </div>
          <button class="btn-route" (click)="findRoutes()" [disabled]="loading">
            🔍 {{ loading ? 'Calcul...' : 'Trouver' }}
          </button>
        </div>
      </div>
      
      <div class="routes-results" *ngIf="routes.length > 0">
        <div class="route-option" *ngFor="let r of routes; let i = index" [class.best]="i === 0">
          <div class="route-rank">
            <span *ngIf="i === 0">⭐</span>
            <span *ngIf="i > 0">#{{ i + 1 }}</span>
          </div>
          <div class="route-details">
            <div class="route-header">
              <div class="route-modes">
                <span class="mode" *ngFor="let mode of r.modes">{{ mode }}</span>
              </div>
              <div class="route-time">{{ r.formattedDuration }}</div>
            </div>
            <div class="route-info">
              <span class="stress-badge" [class]="r.stress_class">Stress: {{ r.stress }}/5</span>
              <span class="co2-badge">🌱 {{ r.co2 }}g CO2</span>
            </div>
            <div class="route-path">{{ r.path }}</div>
            <div class="ai-explanation" *ngIf="r.aiExplanation">
              <span class="ai-icon">🧠</span>
              <span class="ai-text"><strong>Analyse ML :</strong> {{ r.aiExplanation }}</span>
            </div>
          </div>
          <div class="route-score" *ngIf="i === 0">
            <div class="score-label">Meilleur choix</div>
          </div>
        </div>
      </div>
      
      <div class="zones-section">
        <h2>🎯 Zones recommandées</h2>
        <p class="zones-subtitle">Basé sur l'analyse du stress moyen</p>
        
        <div class="zones-grid">
          <div class="zone-card" *ngFor="let zone of zones" [class]="zone.risk_level">
            <div class="zone-header">
              <h3>{{ zone.name }}</h3>
              <span class="zone-risk" [class]="zone.risk_class">{{ zone.risk }}</span>
            </div>
            <div class="zone-metrics">
              <div class="metric">
                <span class="metric-value">{{ zone.stress }}</span>
                <span class="metric-label">Stress moyen</span>
              </div>
              <div class="metric">
                <span class="metric-value">{{ zone.reliability }}%</span>
                <span class="metric-label">Fiabilité</span>
              </div>
            </div>
            <div class="zone-lines">
              <span *ngFor="let line of zone.lines">{{ line }}</span>
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
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }
    .page-header { text-align: center; margin-bottom: 2rem; }
    .page-header h1 { font-size: 2rem; font-weight: 700; color: var(--c-text); margin-bottom: 0.5rem; }
    .page-header p { color: var(--c-text2); }
    
    .route-planner {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }
    .planner-inputs { display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap; }
    .input-group { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 180px; }
    .input-group.time-group { min-width: 140px; }
    .input-group label { font-size: 0.75rem; color: var(--c-text2); font-weight: 500; }
    .input-group input, .input-group select {
      padding: 10px 12px; background: var(--bg);
      border: 1px solid var(--border); border-radius: 8px;
      color: var(--c-text); font-size: 0.95rem;
    }
    .btn-route {
      padding: 10px 20px; background: linear-gradient(135deg, #00c2ff, #0072ff);
      border: none; border-radius: 8px; color: #fff;
      font-size: 0.95rem; font-weight: 600; cursor: pointer;
      transition: all 0.2s ease; white-space: nowrap;
    }
    .btn-route:hover:not(:disabled) { transform: translateY(-2px); }
    .btn-route:disabled { opacity: 0.7; cursor: not-allowed; }
    
    .routes-results { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 2rem; }
    .route-option {
      display: flex; gap: 1rem; align-items: center;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 1.25rem;
      transition: all 0.3s ease;
    }
    .route-option.best {
      background: linear-gradient(135deg, rgba(0,194,255,0.1), rgba(157,110,255,0.1));
      border-color: rgba(0,194,255,0.3);
    }
    .route-option:hover { transform: translateY(-2px); border-color: #00c2ff; }
    
    .route-rank { width: 40px; font-size: 1.2rem; text-align: center; }
    .route-details { flex: 1; }
    .route-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
    .route-modes { display: flex; gap: 0.5rem; }
    .mode {
      padding: 4px 10px; background: rgba(0,194,255,0.15);
      border-radius: 4px; font-size: 0.8rem; color: #00c2ff;
    }
    .route-time { font-size: 1.2rem; font-weight: 700; color: var(--c-text); }
    .route-info { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
    .stress-badge, .co2-badge {
      padding: 4px 10px; border-radius: 4px; font-size: 0.8rem;
    }
    .stress-badge.low { background: rgba(0,229,160,0.15); color: #00e5a0; }
    .stress-badge.medium { background: rgba(255,152,0,0.15); color: #ff9800; }
    .stress-badge.high { background: rgba(255,77,106,0.15); color: #ff4d6a; }
    .co2-badge { background: rgba(0,229,160,0.1); color: #00e5a0; }
    .route-path { font-size: 0.85rem; color: var(--c-text2); }
    .route-score .score-label { font-size: 0.75rem; color: #00c2ff; font-weight: 600; }
    
    .ai-explanation {
      margin-top: 1rem; padding: 0.75rem; background: rgba(157,110,255,0.1);
      border-left: 3px solid #9d6eff; border-radius: 4px;
      display: flex; gap: 0.5rem; align-items: flex-start;
    }
    .ai-icon { font-size: 1.2rem; }
    .ai-text { font-size: 0.85rem; color: var(--c-text); line-height: 1.4; }
    .ai-text strong { color: #9d6eff; }
    
    .zones-section { margin-top: 2rem; }
    .zones-section h2 { font-size: 1.3rem; font-weight: 700; color: var(--c-text); margin-bottom: 0.25rem; }
    .zones-subtitle { font-size: 0.85rem; color: var(--c-text2); margin-bottom: 1.5rem; }
    
    .zones-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .zone-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px; padding: 1.25rem;
    }
    .zone-card.low-risk { border-left: 3px solid #00e5a0; }
    .zone-card.medium-risk { border-left: 3px solid #ff9800; }
    .zone-card.high-risk { border-left: 3px solid #ff4d6a; }
    
    .zone-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .zone-header h3 { font-size: 1.1rem; font-weight: 600; color: var(--c-text); }
    .zone-risk {
      padding: 4px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600;
    }
    .zone-risk.low { background: rgba(0,229,160,0.15); color: #00e5a0; }
    .zone-risk.medium { background: rgba(255,152,0,0.15); color: #ff9800; }
    .zone-risk.high { background: rgba(255,77,106,0.15); color: #ff4d6a; }
    
    .zone-metrics { display: flex; gap: 1.5rem; margin-bottom: 1rem; }
    .metric { display: flex; flex-direction: column; }
    .metric-value { font-size: 1.2rem; font-weight: 700; color: var(--c-text); }
    .metric-label { font-size: 0.75rem; color: var(--c-text2); }
    
    .zone-lines { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .zone-lines span {
      padding: 4px 10px; background: var(--bg);
      border-radius: 4px; font-size: 0.8rem; color: var(--c-text2);
    }
  `]
})
export class ClientRoutesComponent implements OnInit {
  loading = false;
  route = { from: '', to: '', when: 'now' };
  routes: any[] = [];
  zones: any[] = [];
  stops: any[] = [];

  constructor(private http: HttpClient, private apiService: ApiService, private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    this.loadStops();
    this.loadRecommendations();
  }
  
  loadStops(): void {
    this.apiService.getStops().subscribe({
      next: (res) => {
        if (res && res.length > 0) {
          this.stops = res;
        } else {
          this.setDefaultStops();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur de chargement des stations (SQL Server non connecté):', err);
        this.setDefaultStops();
        this.cdr.markForCheck();
      }
    });
  }

  setDefaultStops(): void {
    this.stops = [
      { Stop_ID: 1, Stop_Name: 'Arrêt Paris 1' },
      { Stop_ID: 2, Stop_Name: 'Arrêt Paris 2' },
      { Stop_ID: 100, Stop_Name: 'Arrêt Lille 14' },
      { Stop_ID: 105, Stop_Name: 'Arrêt Nantes 1' },
      { Stop_ID: 110, Stop_Name: 'Arrêt Nantes 6' }
    ];
  }
  loadRecommendations(): void {
    // Appel à l'API pour récupérer les zones recommandées (par ex: basées sur le stress)
    const contextData = { user_id: 'default', time_of_day: 'morning' }; 
    
    this.apiService.getRecommendations(contextData).subscribe({
      next: (res) => {
        if (res && res.recommendations && res.recommendations.length > 0) {
          // Adaptation des données de l'API au format attendu par la vue
          this.zones = res.recommendations.map((rec: any, index: number) => ({
            name: rec.zone_name || `Zone ${index + 1}`,
            risk: rec.risk === 'high' ? 'Élevé' : (rec.risk === 'medium' ? 'Moyen' : 'Faible'),
            risk_class: rec.risk === 'high' ? 'high' : (rec.risk === 'medium' ? 'medium' : 'low'),
            risk_level: rec.risk === 'high' ? 'high-risk' : (rec.risk === 'medium' ? 'medium-risk' : 'low-risk'),
            stress: rec.stress_score || (Math.random() * 2 + 1).toFixed(1),
            reliability: rec.reliability || Math.floor(Math.random() * 20 + 80),
            lines: rec.lines || ['🚇 Ligne par défaut']
          }));
        } else {
          // Si l'API retourne un résultat vide, on affiche les zones par défaut
          this.setDefaultZones();
        }
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Erreur de chargement des recommandations:', err);
        // En cas d'erreur (serveur hors ligne), on affiche nos données factices pour que l'UI reste fonctionnelle
        this.setDefaultZones();
        this.cdr.markForCheck();
      }
    });
  }

  setDefaultZones(): void {
    this.zones = [
      {
        name: 'Zone A - Centre historique',
        risk: 'Faible',
        risk_class: 'low',
        risk_level: 'low-risk',
        stress: 1.8,
        reliability: 94,
        lines: ['🚇 M1', '🚇 M4', '🚌 38', '🚌 72']
      },
      {
        name: 'Zone B - Périphérie Nord',
        risk: 'Moyen',
        risk_class: 'medium',
        risk_level: 'medium-risk',
        stress: 3.2,
        reliability: 78,
        lines: ['🚇 M13', '🚌 170', '🚌 274']
      },
      {
        name: 'Zone C - Axe Est-Ouest',
        risk: 'Faible',
        risk_class: 'low',
        risk_level: 'low-risk',
        stress: 2.1,
        reliability: 89,
        lines: ['🚇 M1', '🚇 M9', '🚇 M14']
      }
    ];
  }

  cleanStopName(name: string): string {
    if (!name) return 'Tunis';
    const lower = name.toLowerCase();
    if (lower.startsWith('arrêt') || lower.startsWith('arret')) {
      const parts = name.split(' ');
      if (parts.length >= 2) return parts.slice(1).join(' ');
    }
    return name;
  }

  async getCoordinates(city: string): Promise<{lat: number, lon: number} | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
      const res: any = await firstValueFrom(this.http.get(url).pipe(timeout(4000)));
      if (res && res.length > 0) {
        return { lat: parseFloat(res[0].lat), lon: parseFloat(res[0].lon) };
      }
      return null;
    } catch (e) {
      console.warn("Erreur Nominatim:", e);
      return null;
    }
  }

  async getOsrmRoute(lon1: number, lat1: number, lon2: number, lat2: number): Promise<{distance: number, duration: number} | null> {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=false`;
      const res: any = await firstValueFrom(this.http.get(url).pipe(timeout(4000)));
      if (res && res.routes && res.routes.length > 0) {
        return {
          distance: res.routes[0].distance,
          duration: res.routes[0].duration
        };
      }
      return null;
    } catch (e) {
      console.warn("Erreur OSRM:", e);
      return null;
    }
  }

  async findRoutes(): Promise<void> {
    if (!this.route.from || !this.route.to) {
      alert("Veuillez entrer un départ et une arrivée.");
      return;
    }
    
    this.loading = true;
    this.cdr.markForCheck();
    
    try {
      const fromCity = this.cleanStopName(this.route.from);
      const toCity = this.cleanStopName(this.route.to);
      
      const fromCoords = await this.getCoordinates(fromCity);
      const toCoords = await this.getCoordinates(toCity);
      
      let realDistanceKm = 15;
      let realDurationMin = 25;

      if (fromCoords && toCoords) {
        const osrmData = await this.getOsrmRoute(fromCoords.lon, fromCoords.lat, toCoords.lon, toCoords.lat);
        if (osrmData) {
          realDistanceKm = osrmData.distance / 1000;
          realDurationMin = osrmData.duration / 60;
        }
      } else {
        realDurationMin = this.calculateBaseDuration(fromCity, toCity);
        realDistanceKm = realDurationMin * 0.8;
      }

      const mockTransportData = {
        Line: 'M1', Day_of_Week: 'Monday', Time_of_Day: 'Morning Peak',
        Weather_Conditions: 'Clear', Direction: 'Northbound', Vehicle_Type: 'Metro'
      };
      
      const mockStressData = {
        Speed: realDistanceKm / (realDurationMin / 60 || 1),
        Heart_Rate: 85, Traffic_Density: 7, 
        Weather_Conditions: 0, Transportation_Mode: 1
      };
      
      const mockCo2Data = {
        Vehicle_Type: 'Car', Fuel_Type: 'Petrol', Engine_Size: 1.6, Distance: realDistanceKm
      };

      const results = await firstValueFrom(forkJoin({
        weather: this.apiService.getRealtimeWeather('Tunis').pipe(timeout(8000), catchError(() => of({ condition_en: 'Clear', temperature: 22 }))),
        transport: this.apiService.predictRetard(mockTransportData).pipe(timeout(8000), catchError(() => of({ prediction: 0 }))),
        stress: this.apiService.predictStress(mockStressData).pipe(timeout(8000), catchError(() => of({ prediction: 2 }))),
        co2: this.apiService.predictCo2(mockCo2Data).pipe(timeout(8000), catchError(() => of({ prediction: realDistanceKm * 120 })))
      }));

      this.buildSmartRoutes(results, realDistanceKm, realDurationMin);

    } catch (e) {
      console.error("Erreur critique lors de la construction des routes:", e);
      alert("Erreur de calcul des routes. Voir la console.");
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  formatDuration(minutes: number): string {
    const totalMinutes = Math.round(minutes);
    if (totalMinutes < 60) return `${totalMinutes} min`;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  calculateBaseDuration(from: string, to: string): number {
    if (!from || !to || from === to) return 15;
    const hash = (from.charCodeAt(0) + to.charCodeAt(from.length > 2 ? 2 : 0)) % 10;
    return 12 + (hash * 3);
  }

  buildSmartRoutes(results: any, realDistanceKm: number, realDurationMin: number): void {
    const weather = results.weather;
    const transport = results.transport;
    const stress = results.stress;
    const co2 = results.co2;

    const isRaining = weather?.condition_en?.toLowerCase().includes('rain');
    const hasDelay = transport?.prediction === 1 || transport?.delayed === true; 
    const stressLevel = typeof stress?.prediction === 'number' ? stress.prediction : 3;
    const co2Car = typeof co2?.prediction === 'number' ? co2.prediction : realDistanceKm * 120;

    const baseDuration = realDurationMin;
    const distStr = realDistanceKm > 0 ? ` (${realDistanceKm.toFixed(1)} km)` : '';

    this.routes = [];

    const duration1 = Math.round(baseDuration * 1.2);
    let optimizedRoute: any = {
      modes: baseDuration > 100 ? ['🚆', '🚶'] : ['🚇', '🚶'],
      duration: duration1,
      formattedDuration: this.formatDuration(duration1),
      stress: Math.max(1, stressLevel - 1),
      stress_class: 'low',
      co2: Math.round(co2Car * 0.1),
      path: baseDuration > 100 ? `Train Grandes Lignes → Marche${distStr}` : `Métro ligne 1 → Marche${distStr}`
    };

    let aiExplanation = `Ce trajet réduit vos émissions de ${((co2Car - optimizedRoute.co2) / 1000).toFixed(1)}kg de CO2 par rapport à la voiture. `;
    
    if (isRaining) {
      optimizedRoute.modes = baseDuration > 100 ? ['🚆', '🚌'] : ['🚇', '🚌'];
      optimizedRoute.path = baseDuration > 100 ? `Train Grandes Lignes → Correspondance Bus${distStr}` : `Métro ligne 1 → Correspondance Bus${distStr}`;
      aiExplanation += `Météo pluvieuse détectée (${weather.temperature || 14}°C), nous avons privilégié une correspondance couverte. `;
    } else {
      aiExplanation += `Météo idéale (${weather.temperature || 22}°C) pour finir à pied, ce qui réduira activement votre niveau de stress prédit. `;
    }

    if (!hasDelay) {
      aiExplanation += `Le ML Transport confirme 0 retard prévu sur cette ligne.`;
    } else {
      aiExplanation += `Le ML Transport indique un léger risque, mais c'est le meilleur compromis actuel.`;
    }

    optimizedRoute.aiExplanation = aiExplanation;
    this.routes.push(optimizedRoute);

    const carStress = Math.min(5, stressLevel + 2);
    this.routes.push({
      modes: ['🚗'],
      duration: baseDuration,
      formattedDuration: this.formatDuration(baseDuration),
      stress: carStress,
      stress_class: carStress >= 4 ? 'high' : 'medium',
      co2: Math.round(co2Car),
      path: `Trajet direct en voiture personnelle${distStr}`,
      aiExplanation: `L'option la plus rapide (gain de ${Math.round(duration1 - baseDuration)} min), mais le modèle de stress prédit une forte tension à cause du trafic estimé sur ce grand trajet.`
    });

    const duration3 = Math.round(baseDuration * 1.4);
    this.routes.push({
      modes: ['🚌'],
      duration: duration3,
      formattedDuration: this.formatDuration(duration3),
      stress: 2,
      stress_class: 'low',
      co2: Math.round(co2Car * 0.3),
      path: baseDuration > 100 ? `Car longue distance${distStr}` : `Bus direct${distStr}`,
      aiExplanation: hasDelay ? `⚠️ Le ML Transport a détecté de fortes probabilités de retards sur le réseau routier de bus aujourd'hui.` : `Trajet relaxant. Le ML indique un flux fluide aujourd'hui sur cet axe.`
    });
  }

  saveFavoriteRoutes(): void {
    if (this.routes.length === 0) return;

    // Créer un objet avec les informations de la recherche
    const searchInfo = {
      from: this.route.from,
      to: this.route.to,
      when: this.route.when,
      timestamp: new Date().toISOString(),
      routes: this.routes.map(route => ({
        modes: route.modes,
        duration: route.duration,
        path: route.path,
        stress: route.stress,
        co2: route.co2,
        formattedDuration: route.formattedDuration,
        aiExplanation: route.aiExplanation
      }))
    };

    // Récupérer les itinéraires favoris existants
    const existingFavorites = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
    
    // Ajouter le nouvel itinéraire au début
    existingFavorites.unshift(searchInfo);
    
    // Limiter à 20 itinéraires favoris maximum
    if (existingFavorites.length > 20) {
      existingFavorites.splice(20);
    }
    
    // Sauvegarder dans localStorage
    localStorage.setItem('favoriteRoutes', JSON.stringify(existingFavorites));
    
    // Afficher une notification de succès
    this.showNotification('Itinéraires sauvegardés dans vos favoris !');
  }

  private showNotification(message: string): void {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = 'route-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
      z-index: 1000;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    
    // Ajouter l'animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Retirer la notification après 3 secondes
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        document.body.removeChild(notification);
        document.head.removeChild(style);
      }, 300);
    }, 3000);
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

.btn-save-routes {
  background: linear-gradient(135deg, #f59e0b, #d97706);
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
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.btn-save-routes:hover:not(:disabled) {
  background: linear-gradient(135deg, #d97706, #b45309);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.4);
}

.btn-save-routes:active:not(:disabled) {
  transform: translateY(0);
}

.btn-save-routes:disabled {
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
  
  .btn-save-routes {
    padding: 0.6rem 1rem;
    font-size: 0.85rem;
  }
}
`;

// Appliquer les styles au composant
const styleElement = document.createElement('style');
styleElement.textContent = styles;
document.head.appendChild(styleElement);
