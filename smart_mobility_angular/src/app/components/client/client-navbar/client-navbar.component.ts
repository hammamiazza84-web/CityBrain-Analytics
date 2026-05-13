import { Component, ChangeDetectionStrategy, ChangeDetectorRef, HostListener, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';
import { ThemeService } from '../../../services/theme.service';

@Component({
  selector: 'app-client-navbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="client-navbar">
      <div class="nav-brand" (click)="goHome()">
        <img src="assets/citybrain-logo.png.png" alt="CityBrain Analytics" class="brand-logo">
        <span class="brand-text">CityBrain Analytics</span>
      </div>

      <div class="nav-center">
        <div class="nav-links">
          <button type="button" class="nav-link" [class.active]="isActive('/client/home')" (click)="goHome()">Accueil</button>
          <button type="button" class="nav-link" [class.active]="isActive('/client/routes')" (click)="goToRoutes()">Itinéraires</button>
          <button type="button" class="nav-link" [class.active]="isActive('/client/stress')" (click)="goToStress()">Stress</button>
          <button type="button" class="nav-link" [class.active]="isActive('/client/transport')" (click)="goToTransport()">Transport</button>
          <button type="button" class="nav-link" [class.active]="isActive('/client/maps')" (click)="goToMaps()">Trafic</button>
          <button type="button" class="nav-link" [class.active]="isActive('/client/weather')" (click)="goToWeather()">Météo</button>
        </div>

        <div class="nav-more-wrap" (click)="$event.stopPropagation()">
          <button
            type="button"
            class="nav-more-trigger"
            [class.active]="isMoreSectionActive()"
            [attr.aria-expanded]="moreMenuOpen"
            aria-haspopup="true"
            aria-controls="nav-more-panel"
            id="nav-more-trigger"
            (click)="toggleMoreMenu($event)"
          >
            Plus
            <span class="nav-chevron" [class.open]="moreMenuOpen" aria-hidden="true">▾</span>
          </button>
          <div class="nav-more-panel" *ngIf="moreMenuOpen" id="nav-more-panel" role="menu" aria-labelledby="nav-more-trigger">
            <button type="button" role="menuitem" class="nav-more-item" [class.active]="isActive('/client/alerts')" (click)="goToAlerts(); closeMoreMenu()">Alertes</button>
            <button type="button" role="menuitem" class="nav-more-item" [class.active]="isActive('/client/tips')" (click)="goToTips(); closeMoreMenu()">Conseils</button>
          </div>
        </div>
      </div>

      <div class="nav-right">
        <div class="user-chip" [attr.title]="'Bonjour, ' + getUserName()">
          <span class="user-avatar">{{ getUserInitials() }}</span>
          <span class="user-name">{{ getUserName() }}</span>
        </div>
        <div class="nav-actions">
          <button
            type="button"
            class="nav-icon-btn routes-action-btn"
            *ngIf="isActive('/client/routes')"
            (click)="showRoutesAction()"
            title="Itinéraires favoris"
          >
            ⭐
          </button>
          <button
            type="button"
            class="nav-icon-btn dashboard-btn"
            *ngIf="isDecisionMaker()"
            (click)="goToDashboard()"
            title="Dashboard"
          >
            📊
          </button>
          <button type="button" class="nav-icon-btn theme-btn" (click)="toggleTheme()" [attr.title]="isDarkMode ? 'Mode clair' : 'Mode sombre'">
            {{ isDarkMode ? '☀️' : '🌙' }}
          </button>
          <button type="button" class="nav-text-btn logout-btn" (click)="logout()">Déconnexion</button>
        </div>
      </div>
    </nav>
  `,
  styles: [`
    .client-navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 0 1.35rem 0 1.6rem;
      min-height: 60px;
      height: auto;
      background: var(--navbar-bg, rgba(11, 18, 30, 0.95));
      border-bottom: 1px solid var(--navbar-border, rgba(255, 255, 255, 0.08));
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(20px);
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      flex-shrink: 0;
      min-width: 0;
    }

    .brand-logo {
      width: 40px;
      height: 40px;
      object-fit: contain;
      flex-shrink: 0;
      border-radius: 8px;
    }

    .brand-text {
      font-size: 1.05rem;
      font-weight: 600;
      color: var(--c-text);
      white-space: nowrap;
    }

    .nav-center {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      min-width: 0;
      gap: 0.35rem;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
      justify-content: center;
    }

    .nav-link {
      padding: 8px 12px;
      color: var(--c-text2);
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: color 0.2s ease, background 0.2s ease;
      white-space: nowrap;
    }

    .nav-link:hover {
      color: var(--c-text);
      background: var(--bg2);
    }

    .nav-link.active {
      color: #00c2ff;
      background: rgba(0, 194, 255, 0.1);
    }

    .nav-more-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .nav-more-trigger {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 8px 12px;
      font-size: 0.875rem;
      font-weight: 500;
      font-family: inherit;
      color: var(--c-text2);
      background: transparent;
      border: 1px solid transparent;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .nav-more-trigger:hover {
      color: var(--c-text);
      background: var(--bg2);
      border-color: var(--border);
    }

    .nav-more-trigger.active {
      color: #00c2ff;
      background: rgba(0, 194, 255, 0.08);
      border-color: rgba(0, 194, 255, 0.25);
    }

    .nav-chevron {
      font-size: 0.7rem;
      opacity: 0.85;
      transition: transform 0.2s ease;
    }

    .nav-chevron.open {
      transform: rotate(-180deg);
    }

    .nav-more-panel {
      position: absolute;
      top: calc(100% + 6px);
      right: 0;
      min-width: 11.5rem;
      padding: 8px;
      background: var(--card, rgba(22, 28, 42, 0.98));
      border: 1px solid var(--navbar-border, rgba(255, 255, 255, 0.1));
      border-radius: 10px;
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
      display: flex;
      flex-direction: column;
      gap: 2px;
      z-index: 200;
    }

    .nav-more-item {
      width: 100%;
      text-align: left;
      padding: 10px 14px;
      font-size: 0.875rem;
      font-family: inherit;
      font-weight: 500;
      color: var(--c-text2);
      background: transparent;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .nav-more-item:hover {
      color: var(--c-text);
      background: var(--bg2);
    }

    .nav-more-item.active {
      color: #00c2ff;
      background: rgba(0, 194, 255, 0.1);
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
      min-width: 0;
    }

    .user-chip {
      display: flex;
      align-items: center;
      gap: 9px;
      max-width: 152px;
      min-width: 0;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(0, 194, 255, 0.25), rgba(157, 110, 255, 0.35));
      color: var(--c-text);
      font-size: 0.8rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .user-name {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--c-text);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 7px;
    }

    .nav-icon-btn {
      width: 40px;
      height: 40px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 9px;
      font-size: 1.05rem;
      line-height: 1;
      cursor: pointer;
      transition: background 0.2s ease, border-color 0.2s ease, transform 0.15s ease;
      border: 1px solid var(--border);
      background: var(--bg);
      color: var(--c-text);
    }

    .nav-icon-btn:hover {
      background: var(--bg2);
      border-color: rgba(0, 194, 255, 0.35);
    }

    .nav-icon-btn.routes-action-btn {
      border-color: rgba(245, 158, 11, 0.35);
      background: rgba(245, 158, 11, 0.08);
    }

    .nav-icon-btn.routes-action-btn:hover {
      background: rgba(245, 158, 11, 0.18);
      border-color: rgba(245, 158, 11, 0.55);
    }

    .nav-icon-btn.dashboard-btn {
      border-color: rgba(157, 110, 255, 0.35);
      background: rgba(157, 110, 255, 0.08);
    }

    .nav-icon-btn.dashboard-btn:hover {
      background: rgba(157, 110, 255, 0.18);
      border-color: rgba(157, 110, 255, 0.5);
    }

    .nav-icon-btn.theme-btn {
      font-size: 1.05rem;
    }

    .nav-text-btn {
      padding: 7px 14px;
      font-size: 0.8rem;
      font-weight: 600;
      font-family: inherit;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    body.light-theme .brand-logo {
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
    }

    .logout-btn {
      background: rgba(255, 77, 106, 0.08);
      border: 1px solid rgba(255, 77, 106, 0.28);
      color: #ff4d6a;
    }

    .logout-btn:hover {
      background: rgba(255, 77, 106, 0.18);
    }

    @media (max-width: 1100px) {
      .brand-text {
        display: none;
      }
    }

    @media (max-width: 900px) {
      .nav-center {
        justify-content: flex-start;
        overflow-x: auto;
        flex-wrap: nowrap;
        padding-bottom: 2px;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: thin;
      }

      .nav-links {
        flex-wrap: nowrap;
      }

      .user-name {
        display: none;
      }

      .user-chip {
        max-width: none;
      }
    }

    @media (max-width: 520px) {
      .client-navbar {
        padding: 0 0.65rem;
        flex-wrap: wrap;
        row-gap: 8px;
        padding-top: 8px;
        padding-bottom: 8px;
      }

      .nav-center {
        order: 3;
        width: 100%;
        justify-content: flex-start;
      }

      .nav-right {
        margin-left: auto;
      }
    }
  `]
})
export class ClientNavbarComponent implements OnInit {
  isDarkMode = true;
  moreMenuOpen = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private themeService: ThemeService
  ) {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe(() => {
        this.moreMenuOpen = false;
        this.cdr.markForCheck();
      });
  }

  toggleMoreMenu(ev: Event): void {
    ev.stopPropagation();
    this.moreMenuOpen = !this.moreMenuOpen;
    this.cdr.markForCheck();
  }

  closeMoreMenu(): void {
    if (!this.moreMenuOpen) return;
    this.moreMenuOpen = false;
    this.cdr.markForCheck();
  }

  isMoreSectionActive(): boolean {
    return this.isActive('/client/alerts') || this.isActive('/client/tips');
  }

  @HostListener('document:click')
  onDocumentClick(): void {
    if (this.moreMenuOpen) {
      this.moreMenuOpen = false;
      this.cdr.markForCheck();
    }
  }
  
  isActive(path: string): boolean {
    const urlPath = this.router.url.split('?')[0].split('#')[0];
    return urlPath === path || urlPath.startsWith(path + '/');
  }
  
  goHome(): void {
    this.router.navigate(['/client/home']);
  }
  
  goToStress(): void {
    this.router.navigate(['/client/stress']);
  }
  
  goToMaps(): void {
    this.router.navigate(['/client/maps']);
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
  
  goToCarbon(): void {
    this.router.navigate(['/client/carbon']);
  }
  
  goToWeather(): void {
    this.router.navigate(['/client/weather']);
  }
  
  goToAlerts(): void {
    this.router.navigate(['/client/alerts']);
  }

  showRoutesAction(): void {
    // Récupérer les itinéraires favoris du localStorage
    const favoriteRoutes = JSON.parse(localStorage.getItem('favoriteRoutes') || '[]');
    
    if (favoriteRoutes.length === 0) {
      this.showNotification('Aucun itinéraire favori sauvegardé. Utilisez d\'abord la recherche d\'itinéraires !');
      return;
    }
    
    // Afficher les itinéraires favoris
    this.showFavoriteRoutesModal(favoriteRoutes);
  }

  private showFavoriteRoutesModal(routes: any[]): void {
    // Créer une modal pour afficher les favoris
    const modal = document.createElement('div');
    modal.className = 'routes-modal-overlay';
    modal.innerHTML = `
      <div class="routes-modal">
        <div class="modal-header">
          <h3>⭐ Mes Itinéraires Favoris</h3>
          <button class="modal-close" onclick="this.closest('.routes-modal-overlay').remove()">×</button>
        </div>
        <div class="modal-content">
          ${routes.map((route, index) => `
            <div class="favorite-route-item" onclick="window.location.href='/client/routes?from=${encodeURIComponent(route.from)}&to=${encodeURIComponent(route.to)}&when=${encodeURIComponent(route.when)}'">
              <div class="route-header">
                <span class="route-locations">📍 ${route.from} → 🏁 ${route.to}</span>
                <span class="route-time">${new Date(route.timestamp).toLocaleDateString('fr-FR')}</span>
              </div>
              <div class="route-details">
                <div class="route-summary">
                  ${route.routes.map((r: any) => 
                    `<span class="route-option">${r.modes.join('')} ${r.formattedDuration} - ${r.path.split(' ')[0]}</span>`
                  ).join(' | ')}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    
    // Ajouter les styles pour la modal
    const style = document.createElement('style');
    style.textContent = `
      .routes-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .routes-modal {
        background: var(--card, #1a1a1a);
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      }
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid var(--border, #333);
      }
      
      .modal-header h3 {
        margin: 0;
        color: var(--c-text, #fff);
        font-size: 1.2rem;
      }
      
      .modal-close {
        background: none;
        border: none;
        color: var(--c-text2, #999);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
      }
      
      .modal-close:hover {
        color: var(--c-text, #fff);
      }
      
      .modal-content {
        padding: 1rem;
      }
      
      .favorite-route-item {
        background: var(--bg2, #252525);
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;
        border: 1px solid var(--border, #333);
      }
      
      .favorite-route-item:hover {
        background: var(--bg, #2a2a2a);
        border-color: #f59e0b;
        transform: translateY(-2px);
      }
      
      .route-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }
      
      .route-locations {
        color: var(--c-text, #fff);
        font-weight: 600;
        font-size: 0.9rem;
      }
      
      .route-time {
        color: var(--c-text2, #999);
        font-size: 0.8rem;
      }
      
      .route-details {
        color: var(--c-text2, #ccc);
        font-size: 0.8rem;
      }
      
      .route-option {
        margin-right: 0.5rem;
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(modal);
    
    // Retirer les styles quand la modal est fermée
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
        document.head.removeChild(style);
      }
    });
  }

  private showNotification(message: string): void {
    const notification = document.createElement('div');
    notification.className = 'navbar-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 80px;
      right: 20px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
      z-index: 1001;
      font-weight: 600;
      animation: slideIn 0.3s ease-out;
    `;
    
    const animStyle = document.createElement('style');
    animStyle.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(animStyle);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
        if (document.head.contains(animStyle)) {
          document.head.removeChild(animStyle);
        }
      }, 300);
    }, 3000);
  }
  
  isDecisionMaker(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user) return false;
    
    const role = user.role || '';
    
    // Strict decision makers check
    return role === 'smart_mobility_manager' ||
           role === 'urban_planning_director' ||
           role === 'environmental_analyst';
  }

  goToDashboard(): void {
    const user = this.authService.getCurrentUser();
    const email = user?.email || '';
    const role = user?.role || '';
    
    // Rediriger vers le dashboard spécifique selon le rôle
    if (email.includes('urban@') || role === 'urban_planning_director') {
      this.router.navigate(['/urban/dashboard']);
    } else if (email.includes('env@') || role === 'environmental_analyst') {
      this.router.navigate(['/env/dashboard']);
    } else if (email.includes('manager@') || role === 'smart_mobility_manager') {
      this.router.navigate(['/dashboard']);
    } else {
      // Par défaut, rester sur la page client ou aller au dashboard général
      this.router.navigate(['/dashboard']);
    }
  }
  
  ngOnInit(): void {
    // S'abonner aux changements de thème
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.cdr.markForCheck();
    });
    
    // S'abonner aux changements d'utilisateur
    this.authService.currentUser$.subscribe(user => {
      console.log('[Navbar] User updated:', user);
      this.cdr.markForCheck();
    });
  }
  
  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  getUserInitials(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'U';
    return user.email.charAt(0).toUpperCase();
  }
  
  getUserName(): string {
    const user = this.authService.getCurrentUser();
    if (!user) return 'Utilisateur';
    return user.email.split('@')[0];
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
