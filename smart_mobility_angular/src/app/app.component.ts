import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <!-- Show sidebar only for manager/admin (not client) -->
      <app-sidebar *ngIf="showSidebar()"></app-sidebar>
      <main 
        [class.main-content]="showSidebar()" 
        [class.login-page]="isLoginPage()"
        [class.client-page]="isClientPage()">
        <router-outlet></router-outlet>
      </main>
      <!-- Assistant IA Chat Bot -->
      <app-ai-chatbot></app-ai-chatbot>
    </div>
    <!-- Bouton thème EN DEHORS du conteneur scrollable -->
    <button
      *ngIf="showSidebar()"
      type="button"
      class="app-theme-toggle"
      (click)="toggleTheme()"
      [attr.aria-label]="isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'">
      <span class="app-theme-toggle__icon" aria-hidden="true">{{ isDarkMode ? '☀️' : '🌙' }}</span>
      <span class="app-theme-toggle__label">{{ isDarkMode ? 'Mode Clair' : 'Mode Sombre' }}</span>
    </button>
  `,
  styles: [`
    .login-page {
      width: 100%;
      min-height: 100vh;
    }
    
    .client-page {
      width: 100%;
      min-height: 100vh;
      background: #0b121e;
    }

    .app-theme-toggle {
      position: fixed;
      top: 1rem;
      right: 1.25rem;
      z-index: 1000;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.85rem;
      border-radius: 10px;
      font-family: inherit;
      font-size: 0.8125rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid rgba(33, 150, 243, 0.35);
      background: rgba(33, 150, 243, 0.1);
      color: #90caf9;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      transition: background 0.2s ease, border-color 0.2s ease, color 0.2s ease;
      /* Empêcher le scroll de déplacer le bouton */
      will-change: unset;
      transform: none;
    }

    .app-theme-toggle:hover {
      background: rgba(33, 150, 243, 0.18);
      border-color: rgba(33, 150, 243, 0.45);
    }

    :host-context(body.light-theme) .app-theme-toggle {
      border-color: #93c5fd;
      background: #f0f7ff;
      color: #1d4ed8;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
    }

    :host-context(body.light-theme) .app-theme-toggle:hover {
      background: #e0efff;
      border-color: #60a5fa;
    }

    @media (max-width: 768px) {
      .app-theme-toggle {
        top: 0.75rem;
        right: 0.75rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'Smart Mobility Dashboard';
  currentUrl = '';
  isDarkMode = true;

  constructor(
    public authService: AuthService,
    private router: Router,
    private themeService: ThemeService
  ) {
    // Track current URL for layout decisions
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentUrl = event.url;
    });
  }

  ngOnInit(): void {
    this.isDarkMode = this.themeService.isDark();
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
    });

    // Check if user is logged in on app start
    const currentUrl = this.router.url;
    const hasTokenInQuery = window.location.search.includes('token=') || window.location.search.includes('access_token=') || window.location.search.includes('code=');
    const isAuthRoute = currentUrl.startsWith('/login') || currentUrl.startsWith('/auth/callback');

    if (!this.authService.isLoggedIn() && !isAuthRoute && !hasTokenInQuery) {
      this.router.navigate(['/login']);
    }
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }
  
  showSidebar(): boolean {
    // Show sidebar only if logged in and NOT on client pages
    return this.authService.isLoggedIn() && !this.isClientPage() && !this.isLoginPage();
  }
  
  isLoginPage(): boolean {
    return this.currentUrl === '/login' || this.currentUrl === '';
  }
  
  isClientPage(): boolean {
    return this.currentUrl.startsWith('/client');
  }
}
