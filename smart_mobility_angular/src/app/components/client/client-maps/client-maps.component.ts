import { Component, OnInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { ApiService } from '../../../services/api.service';
import { TomTomTrafficService, TrafficDataResponse } from '../../../services/tomtom-traffic.service';
import { ThemeService } from '../../../services/theme.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

interface CongestionZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  congestionLevel: number; // 0-100
  severity: 'low' | 'medium' | 'high' | 'critical';
  area: string;
  estimatedDelay: number;
  vehicles: number;
}

interface TrafficData {
  zones: CongestionZone[];
  timestamp: string;
  averageCongestion: number;
}

@Component({
  selector: 'app-client-maps',
  template: `
    <div class="maps-container">
      <div class="maps-header">
        <h2>🗺️ Trafic & Zones d'Embouteillage en Temps Réel</h2>
        <div class="traffic-stats">
          <div class="stat-badge">
            <span class="label">Congestion Moyenne:</span>
            <span class="value" [ngClass]="'severity-' + getAverageSeverity()">
              {{ trafficData?.averageCongestion || 0 }}%
            </span>
          </div>
          <div class="stat-badge">
            <span class="label">Zones Critiques:</span>
            <span class="value critical">{{ getCriticalZones().length }}</span>
          </div>
          <div class="stat-badge">
            <span class="label">Mise à jour:</span>
            <span class="value">{{ lastUpdate | date:'HH:mm:ss' }}</span>
          </div>
        </div>
      </div>

      <div class="maps-content">
        <div class="map-column">
          <div #mapContainer class="map-canvas"></div>
          <div *ngIf="mapLoadError" class="map-error-banner">
            <p>⚠️ {{ mapErrorText }}</p>
            <p>Assurez-vous d'avoir une clé Google Maps valide dans <strong>src/environments/environment.ts</strong>.</p>
          </div>
        </div>
        
        <div class="traffic-sidebar">
          <div class="sidebar-header">
            <h3>Zones de Trafic</h3>
            <button (click)="refreshTrafficData()" class="refresh-btn" [disabled]="isLoading">
              🔄 Actualiser
            </button>
          </div>

          <div class="zones-list">
            <div *ngIf="isLoading" class="loading">
              <span class="spinner"></span> Chargement des données de trafic...
            </div>

            <div *ngIf="!isLoading && !trafficData?.zones?.length" class="no-data">
              Aucune donnée de trafic disponible
            </div>

            <div 
              *ngFor="let zone of trafficData?.zones | slice:0:8" 
              class="zone-card"
              [ngClass]="'severity-' + zone.severity"
              (click)="focusOnZone(zone)"
            >
              <div class="zone-header">
                <span class="zone-name">📍 {{ zone.area }}</span>
                <span class="congestion-badge" [ngClass]="'severity-' + zone.severity">
                  {{ zone.congestionLevel }}%
                </span>
              </div>
              <div class="zone-details">
                <div class="detail-row">
                  <span class="detail-label">Sévérité:</span>
                  <span class="detail-value" [ngClass]="'severity-' + zone.severity">
                    {{ formatSeverity(zone.severity) }}
                  </span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Véhicules:</span>
                  <span class="detail-value">{{ zone.vehicles }}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Délai estimé:</span>
                  <span class="detail-value">{{ zone.estimatedDelay }} min</span>
                </div>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="zone.congestionLevel"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="maps-footer">
        <div class="legend">
          <div class="legend-item">
            <div class="legend-marker low"></div>
            <span>Faible (0-25%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker medium"></div>
            <span>Moyen (25-50%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker high"></div>
            <span>Élevé (50-75%)</span>
          </div>
          <div class="legend-item">
            <div class="legend-marker critical"></div>
            <span>Critique (75-100%)</span>
          </div>
        </div>
        <div class="info-text">
          <p>💡 Cliquez sur une zone pour la centrer sur la carte</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .maps-container {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 80px);
      background: var(--bg, #f5f5f5);
      padding: 16px;
      gap: 12px;
    }

    .maps-header {
      background: var(--card, white);
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .maps-header h2 {
      margin: 0 0 12px 0;
      font-size: 20px;
      color: var(--c-text, #333);
    }

    .traffic-stats {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .stat-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--bg2, #f0f0f0);
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
    }

    .stat-badge .label {
      color: var(--c-text2, #666);
      font-weight: 500;
    }

    .stat-badge .value {
      font-weight: bold;
      font-size: 14px;
    }

    .value.severity-low { color: #4caf50; }
    .value.severity-medium { color: #ff9800; }
    .value.severity-high { color: #ff5722; }
    .value.severity-critical { color: #c62828; }

    .maps-content {
      display: flex;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }

    .map-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .map-canvas {
      flex: 1;
      min-height: 520px;
      background: var(--card, white);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .map-error-banner {
      padding: 14px 16px;
      background: var(--bg2, #fff4e5);
      border: 1px solid var(--border, #ffd69e);
      border-radius: 8px;
      color: var(--c-text, #663300);
      font-size: 13px;
      line-height: 1.4;
    }

    .traffic-sidebar {
      width: 320px;
      background: var(--card, white);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px;
      border-bottom: 1px solid var(--border, #eee);
    }

    .sidebar-header h3 {
      margin: 0;
      font-size: 16px;
      color: var(--c-text, #333);
    }

    .refresh-btn {
      background: var(--bg2, none);
      border: 1px solid var(--border, #ddd);
      color: var(--c-text, #333);
      padding: 6px 10px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
    }

    .refresh-btn:hover:not(:disabled) {
      background: var(--bg, #f0f0f0);
      border-color: var(--border, #bbb);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .zones-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .loading, .no-data {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--c-text2, #999);
      font-size: 14px;
      gap: 8px;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #3498db;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .zone-card {
      background: var(--bg2, #f9f9f9);
      border-left: 4px solid #4caf50;
      padding: 12px;
      margin-bottom: 8px;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .zone-card:hover {
      background: var(--bg, #f0f0f0);
      transform: translateX(4px);
    }

    .zone-card.severity-low { border-left-color: #4caf50; }
    .zone-card.severity-medium { border-left-color: #ff9800; }
    .zone-card.severity-high { border-left-color: #ff5722; }
    .zone-card.severity-critical { border-left-color: #c62828; }

    .zone-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .zone-name {
      font-weight: 600;
      color: var(--c-text, #333);
      font-size: 14px;
    }

    .congestion-badge {
      font-weight: bold;
      font-size: 12px;
      padding: 2px 6px;
      border-radius: 3px;
      color: white;
    }

    .congestion-badge.severity-low { background: #4caf50; }
    .congestion-badge.severity-medium { background: #ff9800; }
    .congestion-badge.severity-high { background: #ff5722; }
    .congestion-badge.severity-critical { background: #c62828; }

    .zone-details {
      margin-bottom: 8px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 4px;
      color: var(--c-text2, #666);
    }

    .detail-label {
      font-weight: 500;
    }

    .detail-value {
      color: var(--c-text, #333);
    }

    .detail-value.severity-low { color: #4caf50; font-weight: 600; }
    .detail-value.severity-medium { color: #ff9800; font-weight: 600; }
    .detail-value.severity-high { color: #ff5722; font-weight: 600; }
    .detail-value.severity-critical { color: #c62828; font-weight: 600; }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: var(--border, #e0e0e0);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #ff9800;
      transition: width 0.3s;
    }

    .zone-card.severity-low .progress-fill { background: #4caf50; }
    .zone-card.severity-medium .progress-fill { background: #ff9800; }
    .zone-card.severity-high .progress-fill { background: #ff5722; }
    .zone-card.severity-critical .progress-fill { background: #c62828; }

    .maps-footer {
      background: var(--card, white);
      border-radius: 8px;
      padding: 12px 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .legend {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--c-text2, #666);
    }

    .legend-marker {
      width: 12px;
      height: 12px;
      border-radius: 2px;
    }

    .legend-marker.low { background: #4caf50; }
    .legend-marker.medium { background: #ff9800; }
    .legend-marker.high { background: #ff5722; }
    .legend-marker.critical { background: #c62828; }

    .info-text {
      font-size: 12px;
      color: var(--c-text2, #999);
      margin: 0;
    }

    @media (max-width: 1024px) {
      .maps-content {
        flex-direction: column;
      }

      .traffic-sidebar {
        width: 100%;
        max-height: 300px;
      }

      .traffic-stats {
        flex-direction: column;
      }
    }

    /* Correction pour l'interface Pegman/Street View */
    :host ::ng-deep .gm-style .gm-style-cc {
      background-color: rgba(255, 255, 255, 0.9) !important;
      color: #333 !important;
    }
    
    :host ::ng-deep .gm-style .gm-style-cc a {
      color: #1a73e8 !important;
    }
    
    :host ::ng-deep .gm-style .gmnoprint {
      background-color: rgba(255, 255, 255, 0.9) !important;
      border: 1px solid #ccc !important;
      border-radius: 2px !important;
    }
    
    :host ::ng-deep .gm-style .gmnoprint div {
      color: #333 !important;
    }
    
    :host ::ng-deep .gm-style .gmnoprint img {
      opacity: 1 !important;
    }
    
    :host ::ng-deep .gm-style .gm-control-active {
      background-color: rgba(255, 255, 255, 0.9) !important;
      color: #333 !important;
    }
    
    :host ::ng-deep .gm-style .gm-control-active:hover {
      background-color: rgba(235, 235, 235, 0.9) !important;
    }
    
    /* S'assurer que Pegman est visible */
    :host ::ng-deep .gm-style .gm-svpc {
      background-color: white !important;
      border: 1px solid #ccc !important;
      border-radius: 2px !important;
    }
    
    :host ::ng-deep .gm-style .gm-svpc img {
      opacity: 1 !important;
      filter: none !important;
    }
  `]
})
export class ClientMapsComponent implements OnInit, OnDestroy {
  @ViewChild('mapContainer') mapContainer!: ElementRef;

  map: any;
  trafficData: TrafficData | null = null;
  isLoading = false;
  mapLoadError = false;
  mapErrorText = '';
  lastUpdate = new Date();
  isDarkMode = true;
  private destroy$ = new Subject<void>();
  private markersMap = new Map<string, any>();
  private refreshTimer: any;

  constructor(
    private apiService: ApiService,
    private tomtomService: TomTomTrafficService,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    // Get current theme value
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$)).subscribe(isDark => {
      this.isDarkMode = isDark;
      this.applyMapTheme();
    });
    
    this.initializeMap();
    this.loadTrafficData();
    // Refresh traffic data every 30 seconds
    this.refreshTimer = setInterval(() => this.loadTrafficData(), 30000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  private initializeMap(): void {
    const apiKey = environment.googleMapsApiKey?.trim();
    if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
      this.handleMapLoadError(
        'Clé Google Maps manquante ou invalide. Remplacez googleMapsApiKey dans src/environments/environment.ts.'
      );
      return;
    }

    // Load Google Maps API script dynamically
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=maps,places,routes`;
      script.async = true;
      script.defer = true;
      script.onload = () => this.createMap();
      script.onerror = () => this.handleMapLoadError(
        'Impossible de charger l’API Google Maps. Vérifiez la clé API et activez les services requis.'
      );
      document.body.appendChild(script);
    } else {
      this.createMap();
    }
  }

  private createMap(): void {
    if (!this.mapContainer) return;

    try {
      // Default center: Paris, France
      const defaultCenter = { lat: 48.8566, lng: 2.3522 };

      this.map = new (window as any).google.maps.Map(this.mapContainer.nativeElement, {
        zoom: 13,
        center: defaultCenter,
        mapTypeId: 'roadmap',
        // Configuration des contrôles pour éviter les problèmes d'interface
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: (window as any).google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: (window as any).google.maps.ControlPosition.TOP_CENTER
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: (window as any).google.maps.ControlPosition.RIGHT_BOTTOM
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: (window as any).google.maps.ControlPosition.RIGHT_TOP
        },
        zoomControl: true,
        zoomControlOptions: {
          position: (window as any).google.maps.ControlPosition.RIGHT_CENTER
        },
        // S'assurer que l'arrière-plan ne cause pas de problèmes
        backgroundColor: this.isDarkMode ? '#1a1a1a' : '#ffffff'
      });

      // Enable traffic layer
      const trafficLayer = new (window as any).google.maps.TrafficLayer();
      trafficLayer.setMap(this.map);
      
      // Attendre que la carte soit chargée avant d'appliquer le thème
      (window as any).google.maps.event.addListenerOnce(this.map, 'idle', () => {
        this.applyMapTheme();
      });
      
      this.mapLoadError = false;
      this.mapErrorText = '';
    } catch (error: any) {
      this.handleMapLoadError(
        'Erreur lors de l’initialisation de la carte Google Maps. Vérifiez la clé API et la configuration du service.'
      );
      console.error('Google Maps init error:', error);
    }
  }

  private handleMapLoadError(message: string): void {
    this.mapLoadError = true;
    this.mapErrorText = message;
    console.error('Google Maps error:', message);
  }

  private loadTrafficData(): void {
    this.isLoading = true;
    this.tomtomService.getParisTrafficZones()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: TrafficDataResponse) => {
          this.trafficData = {
            zones: data.zones as any,
            timestamp: data.timestamp,
            averageCongestion: data.averageCongestion
          };
          this.lastUpdate = new Date();
          this.updateMapMarkers();
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error('Error loading traffic data from TomTom:', err);
          this.isLoading = false;
          // Use mock data if API fails
          this.trafficData = this.getMockTrafficData();
          this.updateMapMarkers();
        }
      });
  }

  private updateMapMarkers(): void {
    if (!this.map || !this.trafficData?.zones) return;

    // Clear existing markers
    this.markersMap.forEach(marker => marker.setMap(null));
    this.markersMap.clear();

    // Add new markers
    this.trafficData.zones.forEach(zone => {
      const marker = this.createZoneMarker(zone);
      this.markersMap.set(zone.id, marker);
    });
  }

  private createZoneMarker(zone: CongestionZone): any {
    const colors: Record<string, string> = {
      low: '#4caf50',
      medium: '#ff9800',
      high: '#ff5722',
      critical: '#c62828'
    };

    const marker = new (window as any).google.maps.Marker({
      position: { lat: zone.lat, lng: zone.lng },
      map: this.map,
      title: `${zone.area} - ${zone.congestionLevel}%`,
      icon: {
        path: (window as any).google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: colors[zone.severity],
        fillOpacity: 0.8,
        strokeColor: 'white',
        strokeWeight: 2
      }
    });

    const infoWindow = new (window as any).google.maps.InfoWindow({
      content: `
        <div style="font-family: Arial; font-size: 12px; max-width: 250px;">
          <h3 style="margin: 0 0 8px 0;">${zone.area}</h3>
          <p style="margin: 0;"><strong>Congestion:</strong> ${zone.congestionLevel}%</p>
          <p style="margin: 4px 0;"><strong>Sévérité:</strong> <span style="color: ${colors[zone.severity]}">${this.formatSeverity(zone.severity)}</span></p>
          <p style="margin: 4px 0;"><strong>Véhicules:</strong> ${zone.vehicles}</p>
          <p style="margin: 4px 0;"><strong>Délai estimé:</strong> ${zone.estimatedDelay} min</p>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(this.map, marker);
    });

    // Draw circle for zone
    new (window as any).google.maps.Circle({
      center: { lat: zone.lat, lng: zone.lng },
      radius: zone.radius * 1000, // Convert to meters
      map: this.map,
      strokeColor: colors[zone.severity],
      strokeOpacity: 0.3,
      strokeWeight: 2,
      fillColor: colors[zone.severity],
      fillOpacity: 0.1
    });

    return marker;
  }

  focusOnZone(zone: CongestionZone): void {
    if (!this.map) return;
    this.map.setCenter({ lat: zone.lat, lng: zone.lng });
    this.map.setZoom(15);
    const marker = this.markersMap.get(zone.id);
    if (marker) marker.setMap(this.map);
  }

  refreshTrafficData(): void {
    this.loadTrafficData();
  }

  getCriticalZones(): CongestionZone[] {
    return this.trafficData?.zones?.filter(z => z.severity === 'critical') || [];
  }

  getAverageSeverity(): string {
    const avg = this.trafficData?.averageCongestion || 0;
    if (avg < 25) return 'low';
    if (avg < 50) return 'medium';
    if (avg < 75) return 'high';
    return 'critical';
  }

  formatSeverity(severity: string): string {
    const severityMap: Record<string, string> = {
      low: '🟢 Faible',
      medium: '🟡 Moyen',
      high: '🔴 Élevé',
      critical: '🔴 Critique'
    };
    return severityMap[severity] || severity;
  }

  private applyMapTheme(): void {
    if (!this.map) return;

    // Définir le style de la carte selon le thème
    const darkModeStyles = [
      { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
      { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
      {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'geometry',
        stylers: [{ color: '#263c3f' }]
      },
      {
        featureType: 'poi.park',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#6b9a76' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [{ color: '#38414e' }]
      },
      {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#212a37' }]
      },
      {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#9ca5b3' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [{ color: '#746855' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'geometry.stroke',
        stylers: [{ color: '#1f2835' }]
      },
      {
        featureType: 'road.highway',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#f3d19c' }]
      },
      {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [{ color: '#2f3948' }]
      },
      {
        featureType: 'transit.station',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#d59563' }]
      },
      {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [{ color: '#17263c' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#515c6d' }]
      },
      {
        featureType: 'water',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#17263c' }]
      }
    ];

    const lightModeStyles: any[] = []; // Styles par défaut (vide = style Google standard)

    // Appliquer les styles et préserver l'interface utilisateur
    this.map.setOptions({
      styles: this.isDarkMode ? darkModeStyles : lightModeStyles,
      // Préserver les contrôles de l'interface pour éviter le problème de Pegman noir
      controlStyle: 'google',
      // S'assurer que les contrôles sont visibles
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      // Forcer le style des contrôles pour éviter le problème de couleur
      backgroundColor: this.isDarkMode ? '#1a1a1a' : '#ffffff'
    });
  }

  private getMockTrafficData(): TrafficData {
    return {
      zones: [
        {
          id: '1',
          lat: 48.8566,
          lng: 2.3522,
          radius: 1.5,
          congestionLevel: 45,
          severity: 'medium',
          area: 'Île de la Cité',
          estimatedDelay: 12,
          vehicles: 342
        },
        {
          id: '2',
          lat: 48.8708,
          lng: 2.2899,
          radius: 2,
          congestionLevel: 78,
          severity: 'critical',
          area: 'Étoile / Arc de Triomphe',
          estimatedDelay: 25,
          vehicles: 587
        },
        {
          id: '3',
          lat: 48.8396,
          lng: 2.3644,
          radius: 1.8,
          congestionLevel: 62,
          severity: 'high',
          area: 'Gare de Lyon',
          estimatedDelay: 18,
          vehicles: 445
        },
        {
          id: '4',
          lat: 48.8424,
          lng: 2.3536,
          radius: 1.2,
          congestionLevel: 32,
          severity: 'low',
          area: 'Bastille',
          estimatedDelay: 8,
          vehicles: 215
        },
        {
          id: '5',
          lat: 48.8355,
          lng: 2.2865,
          radius: 2.2,
          congestionLevel: 88,
          severity: 'critical',
          area: 'Gare Montparnasse',
          estimatedDelay: 30,
          vehicles: 612
        },
        {
          id: '6',
          lat: 48.8912,
          lng: 2.2417,
          radius: 1.5,
          congestionLevel: 41,
          severity: 'medium',
          area: 'La Défense',
          estimatedDelay: 14,
          vehicles: 298
        }
      ],
      timestamp: new Date().toISOString(),
      averageCongestion: 58
    };
  }
}
