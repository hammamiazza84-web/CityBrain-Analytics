import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../../services/auth.service';

interface PowerBIConfig {
  embedUrl: string;
  reportId: string;
  groupId?: string;
}

@Component({
  selector: 'app-powerbi-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard-page">
      <div class="page-content">
        <div class="page-header">
          <h1>📊 Dashboard Power BI</h1>
          <p>Analyse décisionnelle</p>
        </div>

        <!-- Configuration Panel (if no embed URL) -->
        <div class="config-panel" *ngIf="!hasConfig">
          <div class="evaluation-card">
            <div class="card-header">
              <h2>⚙️ Configuration Power BI</h2>
            </div>
            <div class="card-body">
              <p class="config-info">
                Pour intégrer votre dashboard Power BI, vous devez d'abord :
              </p>
              <ol class="config-steps">
                <li>Publier votre fichier <strong>Dashboard Infrastructure final.pbix</strong> sur Power BI Service</li>
                <li>Obtenir l'URL d'intégration (Embed URL)</li>
                <li>Saisir l'URL ci-dessous :</li>
              </ol>
              
              <div class="form-group">
                <label>URL d'intégration Power BI :</label>
                <input 
                  type="text" 
                  [(ngModel)]="embedUrlInput"
                  placeholder="https://app.powerbi.com/reportEmbed?reportId=..."
                  class="form-control"
                >
              </div>
              
              <div class="form-group">
                <label>ID du Report :</label>
                <input 
                  type="text" 
                  [(ngModel)]="reportIdInput"
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  class="form-control"
                >
              </div>

              <button class="btn-evaluate" (click)="saveConfig()">
                💾 Enregistrer la configuration
              </button>
            </div>
          </div>
        </div>

        <!-- Power BI Embed -->
        <div class="dashboard-container" *ngIf="hasConfig">
          <div class="dashboard-controls">
            <button class="btn-secondary" (click)="refreshDashboard()">
              🔄 Rafraîchir
            </button>
          </div>

          <!-- Iframe Embed -->
          <div class="powerbi-frame-container" [class.cropped-mode]="isSpecializedDecider">
            <iframe 
              *ngIf="safeEmbedUrl"
              [src]="safeEmbedUrl"
              frameborder="0"
              allowFullScreen="true"
              class="powerbi-iframe"
            ></iframe>
          </div>

          <!-- Alternative: Using Power BI JavaScript API -->
          <div class="powerbi-api-container" *ngIf="useJavaScriptAPI">
            <div id="powerbi-container" class="powerbi-host"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .config-panel {
      max-width: 800px;
      margin: 0 auto;
    }

    .config-info {
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 1rem;
      font-size: 1rem;
    }

    .config-steps {
      color: rgba(255, 255, 255, 0.7);
      margin: 1rem 0 1.5rem 1.5rem;
      line-height: 1.8;
    }

    .config-steps li {
      margin-bottom: 0.5rem;
    }

    .form-control {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      color: #fff;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #00c2ff;
      background: rgba(0, 194, 255, 0.05);
    }

    .dashboard-controls {
      display: flex;
      gap: 10px;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .btn-secondary {
      padding: 8px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 0.9rem;
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(0, 194, 255, 0.3);
    }

    .dashboard-container {
      background: transparent;
      border: none;
      padding: 0;
    }

    .powerbi-frame-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      min-height: 600px;
      background: transparent;
      border-radius: 8px;
      overflow: hidden;
    }

    .powerbi-iframe {
      width: 100%;
      height: calc(100% + 38px);
      margin-bottom: -38px;
      border: none;
      transition: all 0.3s ease;
    }

    /* Masquage des onglets si nécessaire (normal) */
    .cropped-mode .powerbi-iframe {
      width: 100%; 
      margin-left: 0; 
      height: calc(100% + 38px);
    }

    .powerbi-host {
      width: 100%;
      height: 80vh;
      min-height: 600px;
    }

    @media (max-width: 768px) {
      .powerbi-frame-container,
      .powerbi-host {
        height: 60vh;
        min-height: 400px;
      }
    }
  `]
})
export class PowerbiDashboardComponent implements OnInit {
  @Input() embedUrl: string = '';
  @Input() reportId: string = '';
  @Input() useJavaScriptAPI: boolean = false;

  embedUrlInput: string = '';
  reportIdInput: string = '';
  hasConfig: boolean = false;
  safeEmbedUrl: SafeResourceUrl | null = null;
  isSpecializedDecider: boolean = false;

  constructor(
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    const role = (user?.role || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();

    // Sélection du rapport selon le rôle
    if (role === 'environmental_analyst' || email.includes('env@')) {
      // Rapport dédié Environnement
      this.embedUrl = 'https://app.powerbi.com/reportEmbed?reportId=45a42d94-51d0-4e40-a3e9-a4834579df94&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730';
      this.reportId = '45a42d94-51d0-4e40-a3e9-a4834579df94';
    } else if (role === 'urban_planning_director' || email.includes('urban@')) {
      // Rapport dédié Urbanisme
      this.embedUrl = 'https://app.powerbi.com/reportEmbed?reportId=8252f2f2-b0d8-4883-b1a8-9aeac037c4bf&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730';
      this.reportId = '8252f2f2-b0d8-4883-b1a8-9aeac037c4bf';
    } else {
      // Rapport Global (Manager / Admin)
      this.embedUrl = 'https://app.powerbi.com/reportEmbed?reportId=a23c9b10-45bc-4eb4-9c15-75047ebfd547&autoAuth=true&ctid=604f1a96-cbe8-43f8-abbf-f8eaf5d85730';
      this.reportId = 'a23c9b10-45bc-4eb4-9c15-75047ebfd547';
    }

    this.setupEmbed();
  }

  saveConfig(): void {
    if (this.embedUrlInput) {
      localStorage.setItem('powerbi_embed_url', this.embedUrlInput);
      localStorage.setItem('powerbi_report_id', this.reportIdInput);

      this.embedUrl = this.embedUrlInput;
      this.reportId = this.reportIdInput;

      this.setupEmbed();
      this.cdr.markForCheck();
    }
  }

  setupEmbed(): void {
    if (!this.embedUrl) return;

    const user = this.authService.getCurrentUser();
    const role = (user?.role || '').toLowerCase();
    const email = (user?.email || '').toLowerCase();

    this.isSpecializedDecider = role === 'urban_planning_director' || 
                                role === 'environmental_analyst' || 
                                email.includes('urban@') || 
                                email.includes('env@');

    try {
      // On utilise une approche robuste pour manipuler l'URL
      let url = this.embedUrl;
      
      // Suppression des paramètres conflictuels s'ils existent déjà
      const paramsToRemove = ['navContentPaneEnabled', 'filterPaneEnabled'];
      paramsToRemove.forEach(p => {
        const regex = new RegExp(`([?&])${p}=[^&]*(&|$)`, 'g');
        url = url.replace(regex, '$1').replace(/[?&]$/, '');
      });

      // Ajout des paramètres métier propres
      const navEnabled = !this.isSpecializedDecider;
      url += (url.includes('?') ? '&' : '?') + `navContentPaneEnabled=${navEnabled}`;
      url += `&filterPaneEnabled=false`;
      
      // Nettoyage des éventuels doubles && ou ?& suite aux remplacements
      url = url.replace(/&&+/g, '&').replace(/\?&/g, '?');

      console.log('[PowerBI] Embedding URL:', url);
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
      this.hasConfig = true;
    } catch (e) {
      console.error('[PowerBI] Error building URL:', e);
      this.safeEmbedUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.embedUrl);
      this.hasConfig = true;
    }
  }

  editConfig(): void {
    this.hasConfig = false;
    this.embedUrlInput = this.embedUrl;
    this.reportIdInput = this.reportId;
    this.cdr.markForCheck();
  }

  refreshDashboard(): void {
    if (this.safeEmbedUrl) {
      // On vide temporairement pour forcer le rechargement de l'iframe
      this.safeEmbedUrl = null;
      this.cdr.markForCheck();

      setTimeout(() => {
        this.setupEmbed();
        this.cdr.markForCheck();
      }, 100);
    }
  }
}
