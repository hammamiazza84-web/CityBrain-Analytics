import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { filter } from 'rxjs/operators';

interface NavItem {
  id: string;
  icon: string;
  label: string;
  section: string;
  route: string;
}

@Component({
  selector: 'app-sidebar',
  template: `
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <img src="assets/citybrain-logo.png.png" alt="CityBrain Analytics" class="logo-img">
          <div class="logo-text-block">
            <div class="logo-text">CityBrain Analytics</div>
            <div class="logo-sub">ML Dashboard</div>
          </div>
        </div>
      </div>

      <div class="sidebar-body">
        <nav class="sidebar-nav" aria-label="Navigation principale">
          <div *ngFor="let section of sections" class="nav-section-wrapper" [class.expanded]="isSectionExpanded(section.name)">
            <button type="button" class="nav-section-header" (click)="toggleSection(section.name)" [attr.aria-expanded]="isSectionExpanded(section.name)">
              <span class="nav-section-title">{{ section.name }}</span>
              <span class="chevron" aria-hidden="true"></span>
            </button>

            <div class="nav-section-content">
              <a *ngFor="let item of section.items"
                 class="nav-item"
                 [class.active]="activeRoute === item.route"
                 [routerLink]="item.route">
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">{{ item.label }}</span>
              </a>
            </div>
          </div>
        </nav>
      </div>

      <!-- User section -->
      <div class="sidebar-footer" *ngIf="currentUser">
        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <div class="user-email">{{ currentUser.email }}</div>
            <div class="user-role">{{ currentUser.role }}</div>
          </div>
        </div>
        <button class="btn-logout" (click)="logout()">
          <span>🚪</span> Déconnexion
        </button>
      </div>
    </aside>
  `,
  styles: [`
    :host {
      display: contents;
    }

    .sidebar-body {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem 0.5rem 0.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
    }

    .logo-text-block {
      min-width: 0;
    }

    .nav-section-wrapper {
      width: 92%;
      max-width: 228px;
      border-radius: 10px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .nav-section-header {
      position: relative;
      width: 100%;
      margin: 0;
      padding: 0.5rem 2rem;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      text-align: center;
      font: inherit;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 10px;
      transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .nav-section-header:hover {
      background: rgba(33, 150, 243, 0.1);
      border-color: rgba(33, 150, 243, 0.28);
    }

    .nav-section-header:focus-visible {
      outline: 2px solid rgba(33, 150, 243, 0.55);
      outline-offset: 2px;
    }

    .nav-section-wrapper.expanded .nav-section-header {
      background: rgba(33, 150, 243, 0.14);
      border-color: rgba(33, 150, 243, 0.35);
      border-bottom-left-radius: 0;
      border-bottom-right-radius: 0;
    }

    .nav-section-title {
      font-size: 0.8125rem;
      font-weight: 700;
      color: var(--c-text, #e8f0fe);
      letter-spacing: 0.02em;
      line-height: 1.25;
      text-align: center;
      padding: 0 0.25rem;
    }

    .chevron {
      position: absolute;
      right: 0.65rem;
      top: 50%;
      flex-shrink: 0;
      width: 0.5rem;
      height: 0.5rem;
      border-right: 2px solid #8ba3c7;
      border-bottom: 2px solid #8ba3c7;
      transform: translateY(-50%) rotate(45deg);
      transition: transform 0.25s ease, border-color 0.2s ease;
    }

    .nav-section-wrapper.expanded .chevron {
      transform: translateY(-50%) rotate(225deg);
      border-color: #64b5f6;
    }

    .nav-section-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      background: rgba(0, 0, 0, 0.14);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-top: none;
      margin-left: 0;
      border-bottom-left-radius: 10px;
      border-bottom-right-radius: 10px;
    }

    .nav-section-wrapper.expanded .nav-section-content {
      max-height: 600px;
      padding: 0.35rem 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 0.75rem 0.45rem 0.85rem;
      color: #a0aec0;
      text-decoration: none;
      font-size: 0.8125rem;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .nav-item:hover {
      color: #fff;
      background: rgba(255, 255, 255, 0.06);
    }

    .nav-item.active {
      color: #90caf9;
      font-weight: 600;
      background: rgba(33, 150, 243, 0.12);
    }

    .nav-icon {
      font-size: 0.95rem;
      width: 1.25rem;
      text-align: center;
      flex-shrink: 0;
    }

    .logo-img {
      width: 36px;
      height: 36px;
      object-fit: contain;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .sidebar-footer {
      flex-shrink: 0;
      padding: 0.875rem;
      border-top: 1px solid rgba(33, 150, 243, 0.2);
      background: rgba(33, 150, 243, 0.07);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin: 0.75rem 0;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: linear-gradient(145deg, #0d47a1 0%, #5e35b1 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.95rem;
      flex-shrink: 0;
    }

    .user-details {
      flex: 1;
      min-width: 0;
    }

    .user-email {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--c-text, #e8f0fe);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      font-size: 0.65rem;
      color: var(--c-text2, #8ba3c7);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .btn-logout {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: rgba(244, 67, 54, 0.08);
      border: 1px solid rgba(229, 62, 62, 0.35);
      border-radius: 10px;
      color: #e57373;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      transition: background 0.2s ease, border-color 0.2s ease;
    }

    .btn-logout:hover {
      background: rgba(244, 67, 54, 0.15);
      border-color: rgba(229, 62, 62, 0.45);
    }

    /* ─── Light theme (dashboard maquette) ─── */
    :host-context(body.light-theme) .nav-section-header {
      background: #eef3f9;
      border-color: #dfe7f0;
      box-shadow: 0 1px 0 rgba(255, 255, 255, 0.9) inset;
    }

    :host-context(body.light-theme) .nav-section-header:hover {
      background: #e4ecf6;
      border-color: #cfd9e8;
    }

    :host-context(body.light-theme) .nav-section-wrapper.expanded .nav-section-header {
      background: #e3eef8;
      border-color: #c5d4e8;
    }

    :host-context(body.light-theme) .nav-section-title {
      color: #1e293b !important;
    }

    :host-context(body.light-theme) .chevron {
      border-color: #64748b;
    }

    :host-context(body.light-theme) .nav-section-wrapper.expanded .chevron {
      border-color: #2563eb;
    }

    :host-context(body.light-theme) .nav-section-content {
      background: #f8fafc;
      border-color: #dfe7f0;
    }

    :host-context(body.light-theme) .nav-item {
      color: #475569;
    }

    :host-context(body.light-theme) .nav-item:hover {
      background: rgba(37, 99, 235, 0.06);
      color: #1d4ed8;
    }

    :host-context(body.light-theme) .nav-item.active {
      background: rgba(37, 99, 235, 0.12);
      color: #1d4ed8;
    }

    :host-context(body.light-theme) .sidebar-footer {
      background: #eef5fb;
      border-top-color: #dbe4f0;
    }

    :host-context(body.light-theme) .user-email {
      color: #0f172a;
    }

    :host-context(body.light-theme) .user-role {
      color: #64748b;
    }

    :host-context(body.light-theme) .btn-logout {
      background: #fef2f2;
      border-color: #fecaca;
      color: #b91c1c;
    }

    :host-context(body.light-theme) .btn-logout:hover {
      background: #fee2e2;
      border-color: #fca5a5;
    }
  `]
})
export class SidebarComponent implements OnInit {
  activeRoute = '/dashboard';
  currentUser: any = null;
  expandedSections = new Set<string>(['Vue d\'ensemble']); // Seul le dashboard est ouvert par défaut
  
  // Toutes les sections disponibles - Uniquement le meilleur modèle par catégorie
  private allSections = [
    {
      name: 'Vue d\'ensemble',
      items: [
        { id: 'dashboard', icon: '📊', label: 'Centre de Pilotage', section: 'Vue d\'ensemble', route: '/dashboard' }
      ],
      roles: ['smart_mobility_manager', 'urban_planning_director', 'environmental_analyst', 'client']
    },
    {
      name: 'Qualité de Service',
      items: [
        { id: 'stress_predict', icon: '🧠', label: 'Indicateurs de Stress', section: 'Smart Mobility', route: '/stress/predict' },
        { id: 'stress_anomaly', icon: '🔴', label: 'Alertes Comportementales', section: 'Smart Mobility', route: '/stress/anomaly' },
        { id: 'transport_retard', icon: '🚌', label: 'Pilotage Ponctualité', section: 'Transport', route: '/transport/retard' }
      ],
      roles: ['smart_mobility_manager', 'client']
    },
    {
      name: 'Analytique & Flux',
      items: [
        { id: 'transport_ts', icon: '📅', label: 'Planification Stratégique', section: 'Transport', route: '/transport/ts' },
        { id: 'transport_anomaly', icon: '🚨', label: 'Diagnostic Perturbations', section: 'Transport', route: '/transport/anomaly' }
      ],
      roles: ['smart_mobility_manager']
    },
    {
      name: 'Actifs & Énergie',
      items: [
        { id: 'infra_clf', icon: '🏗️', label: 'Planification Maintenance', section: 'Infrastructure', route: '/infra/clf' },
        { id: 'infra_reg', icon: '⚡', label: 'Optimisation Énergétique', section: 'Infrastructure', route: '/infra/reg' },
        { id: 'infra_anomaly', icon: '🛡️', label: 'Audit d\'Intégrité', section: 'Infrastructure', route: '/infra/anomaly' }
      ],
      roles: ['smart_mobility_manager', 'urban_planning_director']
    },
    {
      name: 'Environnement',
      items: [
        { id: 'env_co2', icon: '🌿', label: 'Empreinte Carbone', section: 'Analyse', route: '/env/co2' }
      ],
      roles: ['smart_mobility_manager', 'environmental_analyst']
    },
    {
      name: 'Sûreté & Retours',
      items: [
        { id: 'piml_c', icon: '🛡️', label: 'Audit Sécurité & Risques', section: 'Sécurité', route: '/piml/c' },
        { id: 'piml_g', icon: '📝', label: 'Analyse Retours Usagers', section: 'Sécurité', route: '/piml/g' }
      ],
      roles: ['smart_mobility_manager', 'environmental_analyst']
    },
    {
      name: 'Décisionnel',
      items: [
        { id: 'powerbi_dashboard', icon: '📈', label: 'Rapports Power BI', section: 'Business Intelligence', route: '/powerbi/dashboard' }
      ],
      roles: ['smart_mobility_manager', 'urban_planning_director', 'environmental_analyst']
    }
  ];

  // Détecter le rôle de l'utilisateur
  private getUserRole(): string {
    // First try to get role from user object
    if (this.currentUser?.role) {
      return this.currentUser.role;
    }
    
    // Fallback: detect role from email
    const email = this.currentUser?.email || '';
    if (email.includes('client@')) return 'client';
    if (email.includes('urban@')) return 'urban_planning_director';
    if (email.includes('env@')) return 'environmental_analyst';
    if (email.includes('manager@')) return 'smart_mobility_manager';
    
    // Default to manager if can't detect
    return 'smart_mobility_manager';
  }

  // Sections filtrées selon le rôle
  get sections() {
    const userRole = this.getUserRole();
    console.log('[Sidebar] User role detected:', userRole, 'Email:', this.currentUser?.email);
    return this.allSections.filter(section => section.roles.includes(userRole));
  }

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('[Sidebar] User updated:', user);
    });
    
    // Subscribe to route changes
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.activeRoute = event.urlAfterRedirects;
      });
  }

  toggleSection(name: string): void {
    if (this.expandedSections.has(name)) {
      this.expandedSections.delete(name);
    } else {
      this.expandedSections.add(name);
    }
    this.cdr.markForCheck();
  }

  isSectionExpanded(name: string): boolean {
    return this.expandedSections.has(name);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
