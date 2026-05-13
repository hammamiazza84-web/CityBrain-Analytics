import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ApiService } from '../../../services/api.service';

interface DashboardStats {
  trafficCongestion: number;
  weatherTemp: number;
  weatherCondition: string;
  avgStressLevel: string;
}

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  time: string;
}

@Component({
  selector: 'app-client-home',
  template: `
    <div class="client-hero">
      <!-- Background image with train -->
      <div class="hero-bg"></div>
      <div class="hero-overlay"></div>
      
      <div class="hero-content">
        <div class="platform-badge">🧠 CITYBRAIN ANALYTICS PLATFORM</div>
        <h1 class="hero-title">
          Bienvenue sur<br>
          <span class="highlight">CityBrain</span>
        </h1>
        <p class="hero-desc">
          Intelligence artificielle pour la mobilité urbaine intelligente.
          Analysez, prédisez et optimisez vos déplacements.
        </p>
        <div class="hero-actions">
          <button class="btn-primary" (click)="goToStress()">
            <span class="icon">🧠</span> 
            <span class="text">Évaluer mon Stress</span>
          </button>
          <button class="btn-secondary" (click)="goToTransport()">
            <span class="icon">🚌</span> 
            <span class="text">Retard Transport</span>
          </button>
          <button class="btn-secondary" (click)="goToRoutes()">
            <span class="icon">📍</span> 
            <span class="text">Itinéraires</span>
          </button>
        </div>
      </div>
      
      <div class="hero-scroll" (click)="scrollToDashboard()">
        <div class="scroll-arrow"></div>
        <span>Découvrir</span>
      </div>
    </div>

    <!-- SECTION 1: Dashboard Résumé -->
    <div class="home-dashboard" id="dashboard">
      <h2 class="section-title">📊 Vue d'ensemble en temps réel</h2>
      
      <div class="stats-grid">
        <div class="stat-card" (click)="goToTransport()">
          <div class="stat-icon">🚗</div>
          <div class="stat-info">
            <span class="stat-value" [class.high]="stats.trafficCongestion > 70">
              {{ stats.trafficCongestion }}%
            </span>
            <span class="stat-label">Congestion actuelle</span>
            <span class="stat-trend" *ngIf="stats.trafficCongestion > 60">↑ Élevée</span>
          </div>
        </div>
        
        <div class="stat-card">
          <div class="stat-icon">🌤️</div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.weatherTemp }}°C</span>
            <span class="stat-label">{{ stats.weatherCondition }}</span>
            <span class="stat-trend">Paris aujourd'hui</span>
          </div>
        </div>
        
        <div class="stat-card" (click)="goToStress()">
          <div class="stat-icon">😰</div>
          <div class="stat-info">
            <span class="stat-value" [class.medium]="true">{{ stats.avgStressLevel }}</span>
            <span class="stat-label">Stress moyen ville</span>
            <span class="stat-trend">Basé sur 1,240 évaluations</span>
          </div>
        </div>
        
      </div>
    </div>

    <!-- SECTION 2: Nos Services -->
    <div class="services-section">
      <div class="services-header">
        <div class="section-label">
          <span class="label-line"></span>
          <span class="label-text">NOS SERVICES</span>
        </div>
        <h2 class="services-title">Tout ce dont vous avez besoin</h2>
        <p class="services-subtitle">Des outils intelligents pour rendre vos trajets plus sereins et votre ville plus durable.</p>
      </div>
      
      <div class="services-grid">
        <div class="service-card" (click)="goToStress()">
          <div class="service-icon stress">🧠</div>
          <h3>Prédiction de Stress</h3>
          <p>Analysez votre niveau de stress en temps réel selon votre mode de transport et les conditions de trafic.</p>
        </div>
        
        <div class="service-card" (click)="goToRoutes()">
          <div class="service-icon routes">💡</div>
          <h3>Créneaux Optimaux</h3>
          <p>Découvrez les meilleurs moments pour voyager et évitez les embouteillages grâce à notre IA.</p>
        </div>
        
        <div class="service-card" (click)="goToTips()">
          <div class="service-icon tips">🌿</div>
          <h3>Conseils Mobilité</h3>
          <p>Recevez des recommandations personnalisées pour réduire votre impact carbone et améliorer votre bien-être.</p>
        </div>
      </div>
    </div>

    <!-- SECTION 3: Alertes & Notifications -->
    <div class="alerts-section" *ngIf="activeAlerts.length > 0">
      <h2 class="section-title">⚠️ Alertes importantes</h2>
      
      <div class="alerts-container">
        <div 
          class="alert-card" 
          *ngFor="let alert of activeAlerts" 
          [class.critical]="alert.type === 'critical'"
          [class.warning]="alert.type === 'warning'"
          [class.info]="alert.type === 'info'"
          (click)="viewAlert(alert)"
        >
          <div class="alert-icon">
            <span *ngIf="alert.type === 'critical'">🚨</span>
            <span *ngIf="alert.type === 'warning'">⚡</span>
            <span *ngIf="alert.type === 'info'">ℹ️</span>
          </div>
          <div class="alert-content">
            <h4>{{ alert.title }}</h4>
            <p>{{ alert.message }}</p>
            <span class="alert-time">{{ alert.time }}</span>
          </div>
          <div class="alert-action">
            <button class="btn-view">Voir →</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .client-hero {
      min-height: calc(100vh - 64px);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    
    /* Train background image from index.html */
    .hero-bg {
      position: absolute;
      inset: 0;
      background: url('https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=1600&q=80') center/cover no-repeat;
      filter: brightness(var(--bg-brightness, 0.35)) saturate(1.1);
      z-index: 0;
    }
    
    /* Gradient overlay - lighter for light mode */
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: var(--bg-overlay);
      z-index: 1;
    }
    
    .hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      max-width: 720px;
      padding: 0 2rem;
    }
    
    .platform-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      background: rgba(0, 194, 255, 0.1);
      border: 1px solid rgba(0, 194, 255, 0.3);
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #00c2ff;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 1.5rem;
    }
    
    .hero-title {
      font-size: clamp(2.4rem, 5vw, 3.8rem);
      font-weight: 700;
      color: var(--c-text);
      line-height: 1.1;
      margin-bottom: 1.25rem;
      letter-spacing: -1.5px;
    }
    
    .hero-title .highlight {
      color: #00c2ff;
      font-style: normal;
    }
    
    .hero-desc {
      font-size: 1.05rem;
      color: var(--c-text2);
      line-height: 1.7;
      margin-bottom: 2.5rem;
      font-weight: 400;
      max-width: 520px;
      margin-left: auto;
      margin-right: auto;
    }
    
    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    
    .btn-primary {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #00c2ff, #0072ff);
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 6px 24px rgba(0, 114, 255, 0.35);
    }
    
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 32px rgba(0, 114, 255, 0.5);
    }
    
    .btn-secondary {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 16px 32px;
      background: var(--card);
      backdrop-filter: blur(10px);
      color: var(--c-text) !important;
      font-size: 1.05rem;
      font-weight: 700;
      border: 2px solid var(--border);
      border-radius: 16px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      min-width: 220px;
    }
    
    .btn-secondary .text {
      display: inline-block;
      color: inherit;
    }
    
    .btn-secondary .icon {
      font-size: 1.25rem;
      flex-shrink: 0;
    }
    
    .btn-secondary:hover {
      background: var(--bg);
      border-color: var(--c-blue);
      transform: translateY(-2px);
    }
    
    /* Scroll indicator at bottom */
    .hero-scroll {
      position: absolute;
      bottom: 2rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--c-text2);
      font-size: 0.72rem;
      letter-spacing: 1px;
      text-transform: uppercase;
      cursor: pointer;
      z-index: 2;
      transition: all 0.3s ease;
    }
    
    .hero-scroll:hover {
      color: var(--c-text);
    }
    
    .scroll-arrow {
      width: 24px;
      height: 24px;
      border-right: 2px solid var(--c-text2);
      border-bottom: 2px solid var(--c-text2);
      transform: rotate(45deg);
      animation: bounce 2s infinite;
    }
    
    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% { transform: translateY(0) rotate(45deg); }
      40% { transform: translateY(-10px) rotate(45deg); }
      60% { transform: translateY(-5px) rotate(45deg); }
    }

    /* ===== SECTION DASHBOARD ===== */
    .home-dashboard {
      padding: 3rem 2rem;
      background: var(--bg);
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: var(--c-text);
      margin-bottom: 1.5rem;
      text-align: center;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .stat-card {
      background: var(--card);
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
      border-color: var(--c-blue);
    }

    .stat-icon {
      font-size: 2.5rem;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg2);
      border-radius: 12px;
    }

    .stat-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      color: var(--c-text);
    }

    .stat-value.high { color: #ff5722; }
    .stat-value.medium { color: #ff9800; }
    .stat-value.good { color: #4caf50; }

    .stat-label {
      font-size: 0.9rem;
      color: var(--c-text2);
    }

    .stat-trend {
      font-size: 0.75rem;
      color: var(--c-text2);
      font-weight: 500;
    }

    .stat-trend.good {
      color: #4caf50;
    }

    /* ===== SECTION SERVICES ===== */
    .services-section {
      padding: 4rem 2rem;
      background: var(--bg);
    }

    .services-header {
      max-width: 1200px;
      margin: 0 auto 3rem;
      text-align: left;
    }

    .section-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 1rem;
    }

    .label-line {
      width: 30px;
      height: 2px;
      background: #00c2ff;
      border-radius: 2px;
    }

    .label-text {
      font-size: 0.75rem;
      font-weight: 700;
      color: #00c2ff;
      letter-spacing: 2px;
    }

    .services-title {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--c-text);
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .services-subtitle {
      font-size: 1rem;
      color: var(--c-text2);
      max-width: 500px;
      line-height: 1.6;
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .service-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 2rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .service-card:hover {
      transform: translateY(-8px);
      border-color: rgba(0, 194, 255, 0.3);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
    }

    .service-icon {
      width: 60px;
      height: 60px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .service-icon.stress {
      background: rgba(255, 107, 107, 0.15);
    }

    .service-icon.routes {
      background: rgba(255, 193, 7, 0.15);
    }

    .service-icon.tips {
      background: rgba(76, 175, 80, 0.15);
    }

    .service-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--c-text);
      margin-bottom: 0.75rem;
    }

    .service-card p {
      font-size: 0.9rem;
      color: var(--c-text2);
      line-height: 1.5;
      margin: 0;
    }

    @media (max-width: 968px) {
      .services-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 640px) {
      .services-grid {
        grid-template-columns: 1fr;
      }
      
      .services-title {
        font-size: 1.8rem;
      }
    }

    /* ===== SECTION ALERTES ===== */
    .alerts-section {
      padding: 2rem;
      background: var(--bg);
    }

    .alerts-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .alert-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--card);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 4px solid var(--c-blue);
    }

    .alert-card:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .alert-card.critical {
      border-left-color: #ff5722;
      background: linear-gradient(90deg, rgba(255,87,34,0.05) 0%, var(--card) 100%);
    }

    .alert-card.warning {
      border-left-color: #ff9800;
      background: linear-gradient(90deg, rgba(255,152,0,0.05) 0%, var(--card) 100%);
    }

    .alert-card.info {
      border-left-color: #00c2ff;
      background: linear-gradient(90deg, rgba(0,194,255,0.05) 0%, var(--card) 100%);
    }

    .alert-icon {
      font-size: 1.5rem;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--bg2);
      border-radius: 10px;
      flex-shrink: 0;
    }

    .alert-content {
      flex: 1;
    }

    .alert-content h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--c-text);
      margin: 0 0 4px 0;
    }

    .alert-content p {
      font-size: 0.9rem;
      color: var(--c-text2);
      margin: 0;
      line-height: 1.4;
    }

    .alert-time {
      font-size: 0.75rem;
      color: var(--c-text2);
      opacity: 0.7;
    }

    .alert-action {
      flex-shrink: 0;
    }

    .btn-view {
      padding: 8px 16px;
      background: var(--bg2);
      border: none;
      border-radius: 8px;
      color: var(--c-text);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .btn-view:hover {
      background: var(--c-blue);
      color: white;
    }

    @media (max-width: 768px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
      
      .alert-card {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class ClientHomeComponent implements OnInit {
  stats: DashboardStats = {
    trafficCongestion: 67,
    weatherTemp: 18,
    weatherCondition: 'Partiellement nuageux',
    avgStressLevel: 'Modéré',
  };

  activeAlerts: Alert[] = [];
  loadingAlerts = false;

  constructor(private router: Router, public authService: AuthService, private apiService: ApiService) {}

  ngOnInit(): void {
    // Charger les vraies alertes depuis l'API
    this.loadRealAlerts();
    this.loadDashboardData();
  }

  loadRealAlerts(): void {
    this.loadingAlerts = true;
    this.apiService.getTransportAnomalies().subscribe({
      next: (res) => {
        if (res && res.live && res.live.table && res.live.table.length > 0) {
          // Transformer les anomalies en alertes (max 3 pour l'accueil)
          this.activeAlerts = res.live.table
            .filter((item: any) => item.is_anomaly === 1)
            .slice(0, 3)
            .map((item: any, index: number) => this.mapAnomalyToAlert(item, index));
        } else {
          this.activeAlerts = []; // Pas d'anomalies
        }
        this.loadingAlerts = false;
      },
      error: (err) => {
        console.error('Erreur chargement alertes:', err);
        this.activeAlerts = []; // En cas d'erreur, ne rien afficher
        this.loadingAlerts = false;
      }
    });
  }

  private mapAnomalyToAlert(item: any, index: number): Alert {
    const score = item.score || 0;
    const retard = item.retard_s || 0;
    const charge = item.charge_estimee || 0;

    let type: 'critical' | 'warning' | 'info' = 'info';
    if (score > 0.7) type = 'critical';
    else if (score > 0.4) type = 'warning';

    let title = '';
    let message = '';

    if (retard > 300) {
      title = 'Retard important détecté';
      message = `Anomalie sur le segment ${Math.round(item.segment_id || index)}. Retard estimé: ${Math.round(retard/60)} min.`;
    } else if (charge > 80) {
      title = 'Affluence anormale';
      message = `Charge estimée à ${Math.round(charge)}% sur le segment ${Math.round(item.segment_id || index)}.`;
    } else {
      title = `Anomalie détectée - Segment ${Math.round(item.segment_id || index)}`;
      message = 'Comportement anormal du trafic détecté par notre algorithme ML.';
    }

    return {
      id: String(index + 1),
      type: type,
      title: title,
      message: message,
      time: `Il y a ${Math.max(1, index * 5 + 5)} min`
    };
  }

  private loadDashboardData(): void {
    // Simuler une mise à jour des données toutes les 30 secondes
    setInterval(() => {
      // Variation aléatoire de la congestion
      this.stats.trafficCongestion = Math.max(30, Math.min(95, 
        this.stats.trafficCongestion + Math.floor(Math.random() * 10) - 5
      ));
    }, 30000);
  }

  scrollToDashboard(): void {
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  }

  viewAlert(alert: Alert): void {
    // Redirection vers la page Alertes pour voir tous les détails
    this.router.navigate(['/client/alerts']);
  }
  
  goToStress(): void {
    this.router.navigate(['/client/stress']);
  }
  
  goToTips(): void {
    this.router.navigate(['/client/tips']);
  }

  goToTransport(): void {
    this.router.navigate(['/client/transport']);
  }
  
  goToRoutes(): void {
    this.router.navigate(['/client/routes']);
  }
  
}
