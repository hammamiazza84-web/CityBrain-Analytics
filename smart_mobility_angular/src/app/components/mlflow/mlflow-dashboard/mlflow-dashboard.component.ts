import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { environment } from '@env/environment';
import { ThemeService } from '../../../services/theme.service';

interface MLflowRun {
  run_id: string;
  run_name: string;
  status: string;
  start_time: number;
  end_time?: number;
  experiment_id: string;
}

interface MLflowExperiment {
  experiment_id: string;
  name: string;
  artifact_location: string;
  lifecycle_stage: string;
}

@Component({
  selector: 'app-mlflow-dashboard',
  standalone: false,
  template: `
    <div class="mlflow-container" [class.dark-theme]="isDarkMode">
      <!-- Configuration Panel -->
      <div class="config-panel" *ngIf="showConfig">
        <div class="config-card">
          <div class="config-header">
            <h2>Configuration MLflow</h2>
            <p>Saisissez l'URL de votre serveur MLflow</p>
          </div>
          
          <div class="config-form">
            <div class="form-group">
              <label>URL MLflow UI</label>
              <input 
                type="text" 
                [(ngModel)]="mlflowUrlInput"
                placeholder="http://localhost:5003 (défaut) ou https://mlflow.votre-serveur.com"
                class="form-input"
              >
              <small class="hint">
                Par défaut : http://localhost:5003 (local) ou votre serveur MLflow
              </small>
            </div>
            
            <div class="form-actions">
              <button class="btn-save" (click)="saveConfig()">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Dashboard View -->
      <div class="dashboard-view" *ngIf="!showConfig">
        <div class="dashboard-header">
          <div class="header-info">
            <h1>MLflow Tracking</h1>
            <p class="server-url">Serveur : {{ mlflowUrl }}</p>
          </div>
          <div class="header-actions">
            <button class="btn-refresh" (click)="refreshDashboard()" title="Rafraîchir">
              Rafraîchir
            </button>
            <button class="btn-config" (click)="showConfig = true" title="Modifier configuration">
              Configurer
            </button>
            <a 
              [href]="mlflowUrl" 
              target="_blank" 
              class="btn-external"
              title="Ouvrir dans nouvel onglet"
            >
              Ouvrir MLflow
            </a>
          </div>
        </div>

        <!-- MLflow Native Dashboard -->
        <div class="dashboard-content">
          <!-- Loading -->
          <div *ngIf="isLoading" class="loading-message">
            <div class="spinner"></div>
            <p>Chargement des données MLflow...</p>
          </div>
          
          <!-- Error -->
          <div *ngIf="!isLoading && connectionError" class="error-message">
            <p>⚠️ Impossible de se connecter à MLflow</p>
            <p class="error-detail">Vérifiez que MLflow est lancé sur {{ mlflowUrl }}</p>
            <div class="error-actions">
              <button class="btn-save" (click)="loadData()">Réessayer</button>
              <button class="btn-config" (click)="showConfig = true">Configurer</button>
            </div>
          </div>
          
          <!-- Dashboard -->
          <div *ngIf="!isLoading && !connectionError" class="mlflow-dashboard">
            <!-- Experiments -->
            <div class="experiments-section">
              <h2>📁 Experiments</h2>
              <div class="experiment-list">
                <div 
                  *ngFor="let exp of experiments" 
                  class="experiment-card"
                  [class.active]="selectedExperiment?.experiment_id === exp.experiment_id"
                  (click)="selectExperiment(exp)"
                >
                  <div class="exp-icon">🧪</div>
                  <div class="exp-info">
                    <h3>{{ exp.name }}</h3>
                    <p>ID: {{ exp.experiment_id }}</p>
                  </div>
                  <div class="exp-badge">{{ getRunCountForExperiment(exp.experiment_id) }} runs</div>
                </div>
              </div>
            </div>
            
            <!-- Runs -->
            <div class="runs-section" *ngIf="selectedExperiment">
              <div class="runs-header">
                <h2>🏃 Runs - {{ selectedExperiment.name }}</h2>
                <a [href]="mlflowUrl + '/#/experiments/' + selectedExperiment.experiment_id" target="_blank" class="btn-view-full">
                  Voir dans MLflow UI →
                </a>
              </div>
              
              <div class="runs-table-container" *ngIf="runs.length > 0">
                <table class="runs-table">
                  <thead>
                    <tr>
                      <th>Run Name</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Duration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let run of runs" class="run-row">
                      <td class="run-name">{{ run.run_name || run.run_id }}</td>
                      <td>
                        <span class="status-badge" [class]="'status-' + run.status.toLowerCase()">
                          {{ run.status }}
                        </span>
                      </td>
                      <td>{{ formatDate(run.start_time) }}</td>
                      <td>{{ formatDuration(run.start_time, run.end_time) }}</td>
                      <td>
                        <a 
                          [href]="mlflowUrl + '/#/experiments/' + run.experiment_id + '/runs/' + run.run_id" 
                          target="_blank" 
                          class="btn-view"
                        >
                          Détails
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div *ngIf="runs.length === 0" class="no-runs">
                <p>Aucun run trouvé pour cet experiment.</p>
                <button class="btn-generate" (click)="openMlflowUI()">
                  🚀 Ouvrir MLflow pour créer des runs
                </button>
              </div>
            </div>
            
            <!-- Quick Actions -->
            <div class="quick-actions" *ngIf="!selectedExperiment">
              <div class="info-card">
                <h3>🎯 MLflow Tracking Intégré</h3>
                <p>Sélectionnez un experiment pour voir les runs, ou utilisez les boutons ci-dessus pour accéder à l'interface complète MLflow.</p>
                <div class="stats-row">
                  <div class="stat-box">
                    <div class="stat-value">{{ experiments.length }}</div>
                    <div class="stat-label">Experiments</div>
                  </div>
                  <div class="stat-box">
                    <div class="stat-value">{{ runs.length }}</div>
                    <div class="stat-label">Runs Total</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mlflow-container {
      min-height: 100vh;
      background: var(--bg-primary, #0d2137);
      padding: 1.5rem;
    }

    .mlflow-container.dark-theme {
      --bg-primary: #0d2137;
      --bg-secondary: rgba(33, 150, 243, 0.08);
      --text-primary: #e3f2fd;
      --border-color: rgba(33, 150, 243, 0.2);
    }

    /* Configuration Panel */
    .config-panel {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    .config-card {
      background: rgba(33, 150, 243, 0.05);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 100%;
    }

    .config-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .config-header h2 {
      color: var(--text-primary, #e3f2fd);
      margin-bottom: 0.5rem;
    }

    .config-header p {
      color: #8ba3c7;
      font-size: 0.9rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      color: var(--text-primary, #e3f2fd);
      font-weight: 500;
      margin-bottom: 0.5rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: rgba(13, 33, 55, 0.8);
      border: 1px solid rgba(33, 150, 243, 0.3);
      border-radius: 8px;
      color: var(--text-primary, #e3f2fd);
      font-size: 0.9rem;
    }

    .form-input:focus {
      outline: none;
      border-color: #2196f3;
    }

    .hint {
      display: block;
      color: #8ba3c7;
      font-size: 0.8rem;
      margin-top: 0.5rem;
    }

    .server-status {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .server-status.online {
      background: rgba(76, 175, 80, 0.15);
      color: #81c784;
      border: 1px solid rgba(76, 175, 80, 0.3);
    }

    .server-status.offline {
      background: rgba(244, 67, 54, 0.15);
      color: #ef5350;
      border: 1px solid rgba(244, 67, 54, 0.3);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 2s infinite;
    }

    .server-status.online .status-dot {
      background: #4caf50;
    }

    .server-status.offline .status-dot {
      background: #f44336;
      animation: none;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .form-actions {
      display: flex;
      gap: 1rem;
    }

    .btn-save {
      flex: 1;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #1565C0, #0d47a1);
      border: none;
      border-radius: 8px;
      color: white;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-save:hover {
      background: linear-gradient(135deg, #1976D2, #1565C0);
      transform: translateY(-2px);
    }

    /* Dashboard View */
    .dashboard-view {
      display: flex;
      flex-direction: column;
      height: calc(100vh - 3rem);
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      margin-bottom: 1rem;
      border-bottom: 1px solid rgba(33, 150, 243, 0.2);
    }

    .header-info h1 {
      color: var(--text-primary, #e3f2fd);
      margin: 0;
      font-size: 1.5rem;
    }

    .server-url {
      color: #8ba3c7;
      margin: 0.25rem 0 0 0;
      font-size: 0.85rem;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-refresh, .btn-config, .btn-external {
      padding: 0.6rem 1.2rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn-refresh {
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid rgba(33, 150, 243, 0.3);
      color: #64b5f6;
    }

    .btn-refresh:hover {
      background: rgba(33, 150, 243, 0.2);
    }

    .btn-config {
      background: rgba(255, 152, 0, 0.1);
      border: 1px solid rgba(255, 152, 0, 0.3);
      color: #ffb74d;
    }

    .btn-config:hover {
      background: rgba(255, 152, 0, 0.2);
    }

    .btn-external {
      background: linear-gradient(135deg, #4CAF50, #2E7D32);
      border: none;
      color: white;
    }

    .btn-external:hover {
      background: linear-gradient(135deg, #66BB6A, #4CAF50);
    }

    .iframe-container {
      flex: 1;
      background: rgba(13, 33, 55, 0.5);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-radius: 12px;
      overflow: hidden;
    }

    .mlflow-iframe {
      width: 100%;
      height: 100%;
      border: none;
    }

    .error-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #8ba3c7;
      text-align: center;
      padding: 2rem;
    }

    .error-message p {
      margin-bottom: 1rem;
    }

    .error-detail {
      font-size: 0.85rem;
      color: #ef5350;
      margin-bottom: 1.5rem;
    }

    .error-actions {
      display: flex;
      gap: 1rem;
    }

    .loading-message {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #8ba3c7;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(33, 150, 243, 0.2);
      border-top-color: #2196f3;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .dashboard-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }

      .header-actions {
        flex-wrap: wrap;
      }
    }

    /* Dashboard Content */
    .dashboard-content {
      flex: 1;
      min-height: 500px;
    }

    .mlflow-dashboard {
      display: grid;
      grid-template-columns: 350px 1fr;
      gap: 1.5rem;
      height: 100%;
    }

    .experiments-section {
      background: rgba(13, 33, 55, 0.5);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .experiments-section h2 {
      color: #e3f2fd;
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .experiment-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .experiment-card {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: rgba(33, 150, 243, 0.1);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .experiment-card:hover {
      background: rgba(33, 150, 243, 0.2);
      border-color: rgba(33, 150, 243, 0.4);
    }

    .experiment-card.active {
      background: rgba(33, 150, 243, 0.3);
      border-color: #2196f3;
    }

    .exp-icon {
      font-size: 1.5rem;
    }

    .exp-info {
      flex: 1;
    }

    .exp-info h3 {
      color: #e3f2fd;
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .exp-info p {
      color: #8ba3c7;
      font-size: 0.8rem;
    }

    .exp-badge {
      background: rgba(33, 150, 243, 0.2);
      color: #2196f3;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
    }

    .runs-section {
      background: rgba(13, 33, 55, 0.5);
      border: 1px solid rgba(33, 150, 243, 0.2);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .runs-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .runs-header h2 {
      color: #e3f2fd;
      font-size: 1.2rem;
    }

    .btn-view-full {
      background: transparent;
      border: 1px solid #2196f3;
      color: #2196f3;
      padding: 0.5rem 1rem;
      border-radius: 6px;
      text-decoration: none;
      font-size: 0.85rem;
      transition: all 0.3s ease;
    }

    .btn-view-full:hover {
      background: rgba(33, 150, 243, 0.2);
    }

    .runs-table-container {
      overflow-x: auto;
    }

    .runs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .runs-table th {
      text-align: left;
      padding: 0.75rem;
      color: #8ba3c7;
      font-weight: 500;
      border-bottom: 1px solid rgba(33, 150, 243, 0.2);
    }

    .runs-table td {
      padding: 0.75rem;
      color: #e3f2fd;
      border-bottom: 1px solid rgba(33, 150, 243, 0.1);
    }

    .run-name {
      font-family: monospace;
      font-size: 0.85rem;
    }

    .status-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      text-transform: capitalize;
    }

    .status-running {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }

    .status-finished {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .status-failed {
      background: rgba(244, 67, 54, 0.2);
      color: #f44336;
    }

    .status-scheduled {
      background: rgba(33, 150, 243, 0.2);
      color: #2196f3;
    }

    .btn-view {
      background: rgba(33, 150, 243, 0.2);
      border: 1px solid rgba(33, 150, 243, 0.4);
      color: #2196f3;
      padding: 0.25rem 0.75rem;
      border-radius: 4px;
      text-decoration: none;
      font-size: 0.8rem;
      transition: all 0.3s ease;
    }

    .btn-view:hover {
      background: rgba(33, 150, 243, 0.3);
    }

    .no-runs {
      text-align: center;
      padding: 3rem;
      color: #8ba3c7;
    }

    .btn-generate {
      background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%);
      border: none;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      margin-top: 1rem;
      transition: all 0.3s ease;
    }

    .btn-generate:hover {
      box-shadow: 0 4px 15px rgba(33, 150, 243, 0.4);
    }

    .quick-actions {
      grid-column: 1 / -1;
    }

    .info-card {
      background: linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(13, 33, 55, 0.5) 100%);
      border: 1px solid rgba(33, 150, 243, 0.3);
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
    }

    .info-card h3 {
      color: #e3f2fd;
      margin-bottom: 1rem;
    }

    .info-card p {
      color: #8ba3c7;
      margin-bottom: 1.5rem;
    }

    .stats-row {
      display: flex;
      justify-content: center;
      gap: 3rem;
    }

    .stat-box {
      text-align: center;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      color: #2196f3;
    }

    .stat-label {
      color: #8ba3c7;
      font-size: 0.9rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MlflowDashboardComponent implements OnInit {
  mlflowUrl: string = '';
  mlflowUrlInput: string = '';
  showConfig: boolean = false;
  isDarkMode: boolean = true;
  isLoading: boolean = false;
  connectionError: boolean = false;
  
  // MLflow Data
  experiments: MLflowExperiment[] = [];
  runs: MLflowRun[] = [];
  allRuns: MLflowRun[] = [];
  selectedExperiment: MLflowExperiment | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private themeService: ThemeService
  ) {}

  ngOnInit(): void {
    this.themeService.isDarkMode$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.cdr.markForCheck();
    });
    // Check for saved configuration
    const savedUrl = localStorage.getItem('mlflow_url');
    
    if (savedUrl) {
      this.mlflowUrl = savedUrl;
    } else {
      // Default configuration - Local MLflow
      this.mlflowUrl = environment.mlflowDefaultUrl;
    }
    
    // Ensure URL starts with http
    if (!this.mlflowUrl.startsWith('http')) {
      this.mlflowUrl = 'http://' + this.mlflowUrl;
    }
    // Remove trailing slash
    this.mlflowUrl = this.mlflowUrl.replace(/\/$/, '');

    // Sync the local theme state with the global theme service
    this.isDarkMode = this.themeService.isDark();
    
    // Load MLflow data
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.connectionError = false;
    this.cdr.markForCheck();
    
    // Use Flask proxy instead of direct MLflow call (avoids CORS)
    const proxyUrl = `${environment.apiUrl}/mlflow`;
    
    // Load experiments
    this.http.get<any>(`${proxyUrl}/experiments/list`).subscribe({
      next: (response) => {
        this.experiments = response.experiments || [];
        
        // Load all runs
        this.loadAllRuns();
      },
      error: (err) => {
        console.error('Error loading experiments:', err);
        this.isLoading = false;
        this.connectionError = true;
        this.cdr.markForCheck();
      }
    });
  }
  
  loadAllRuns(): void {
    const experimentIds = this.experiments.map(e => e.experiment_id);
    
    if (experimentIds.length === 0) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }
    
    const proxyUrl = `${environment.apiUrl}/mlflow`;
    this.http.post<any>(`${proxyUrl}/runs/search`, {
      experiment_ids: experimentIds,
      max_results: 100
    }).subscribe({
      next: (response) => {
        this.allRuns = response.runs || [];
        this.runs = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading runs:', err);
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }
  
  selectExperiment(exp: MLflowExperiment): void {
    this.selectedExperiment = exp;
    this.runs = this.allRuns.filter(run => run.experiment_id === exp.experiment_id);
    this.cdr.markForCheck();
  }
  
  getRunCountForExperiment(expId: string): number {
    return this.allRuns.filter(run => run.experiment_id === expId).length;
  }
  
  formatDate(timestamp: number): string {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatDuration(start: number, end?: number): string {
    if (!start) return '-';
    const endTime = end || Date.now();
    const duration = endTime - start;
    const seconds = Math.floor(duration / 1000);
    
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  }

  saveConfig(): void {
    if (this.mlflowUrlInput) {
      localStorage.setItem('mlflow_url', this.mlflowUrlInput);
      
      this.mlflowUrl = this.mlflowUrlInput;
      if (!this.mlflowUrl.startsWith('http')) {
        this.mlflowUrl = 'http://' + this.mlflowUrl;
      }
      this.mlflowUrl = this.mlflowUrl.replace(/\/$/, '');
      
      this.showConfig = false;
      this.loadData();
    }
  }

  refreshDashboard(): void {
    this.loadData();
  }
  
  openMlflowUI(): void {
    window.open(this.mlflowUrl, '_blank');
  }
}