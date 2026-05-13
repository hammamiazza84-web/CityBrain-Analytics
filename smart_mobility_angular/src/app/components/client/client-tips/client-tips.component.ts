import { Component } from '@angular/core';

@Component({
  selector: 'app-client-tips',
  template: `
    <div class="client-page with-bg">
      <div class="page-bg"></div>
      <div class="page-overlay"></div>
      <div class="page-content">
      <div class="page-header">
        <h1>🎯 Conseils & Astuces</h1>
        <p>Optimisez vos déplacements au quotidien</p>
      </div>
      
      <div class="tips-grid">
        <div class="tip-card" *ngFor="let tip of tips" [style.border-color]="tip.color">
          <div class="tip-icon" [style.background]="tip.color + '20'" [style.color]="tip.color">
            {{ tip.icon }}
          </div>
          <h3>{{ tip.title }}</h3>
          <p>{{ tip.description }}</p>
          <div class="tip-tags">
            <span class="tag" *ngFor="let tag of tip.tags">{{ tag }}</span>
          </div>
        </div>
      </div>
      
      <div class="stats-section">
        <h2>📊 Impact de vos choix</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">-30%</div>
            <div class="stat-label">Stress en heures creuses</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">+25%</div>
            <div class="stat-label">Productivité</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">-20%</div>
            <div class="stat-label">Émissions CO2</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">45min</div>
            <div class="stat-label">Temps gagné/jour</div>
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
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    .page-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--c-text);
      margin-bottom: 0.5rem;
    }
    
    .page-header p {
      color: var(--c-text2);
    }
    
    .tips-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }
    
    .tip-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-left: 3px solid;
      border-radius: 12px;
      padding: 1.5rem;
      transition: all 0.3s ease;
    }
    
    .tip-card:hover {
      transform: translateY(-4px);
      background: var(--bg2);
    }
    
    .tip-icon {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .tip-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--c-text);
      margin-bottom: 0.75rem;
    }
    
    .tip-card p {
      font-size: 0.9rem;
      color: var(--c-text2);
      line-height: 1.6;
      margin-bottom: 1rem;
    }
    
    .tip-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    
    .tag {
      padding: 4px 10px;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 4px;
      font-size: 0.75rem;
      color: var(--c-text2);
    }
    
    .stats-section {
      margin-top: 3rem;
    }
    
    .stats-section h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--c-text);
      margin-bottom: 1.5rem;
      text-align: center;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .stat-card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
    }
    
    .stat-card:hover {
      transform: translateY(-4px);
      border-color: var(--c-blue);
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.12);
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: 800;
      color: var(--c-blue);
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    
    .stat-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--c-text2);
      line-height: 1.35;
    }

    :host-context(body.light-theme) .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.07);
    }

    :host-context(body.light-theme) .stat-value {
      color: #0369a1;
    }

    :host-context(body.light-theme) .stat-label {
      color: #334155;
    }

    :host-context(body.light-theme) .stat-card:hover {
      border-color: #0284c7;
      box-shadow: 0 8px 24px rgba(2, 132, 199, 0.14);
    }
  `]
})
export class ClientTipsComponent {
  tips = [
    {
      icon: '🌅',
      title: 'Voyagez tôt le matin',
      description: 'Les transports sont moins encombrés avant 8h. Profitez-en pour arriver détendu au travail.',
      tags: ['Peak', 'Métro', 'Bus'],
      color: '#00c2ff'
    },
    {
      icon: '🚴',
      title: 'Privilégiez le vélo',
      description: 'Pour les trajets de moins de 5km, le vélo est souvent plus rapide et sans stress.',
      tags: ['Écologique', 'Santé', 'Courtes distances'],
      color: '#00e5a0'
    },
    {
      icon: '📱',
      title: 'Utilisez les apps en temps réel',
      description: 'Consultez l\'affluence avant de partir pour choisir le meilleur itinéraire.',
      tags: ['Technologie', 'Planification'],
      color: '#9d6eff'
    },
    {
      icon: '🎧',
      title: 'Créez votre bulle sonore',
      description: 'La musique ou les podcasts réduisent la perception du stress dans les transports bondés.',
      tags: ['Bien-être', 'Détente'],
      color: '#ff8f3c'
    },
    {
      icon: '🚶',
      title: 'Marchez entre les arrêts',
      description: 'Descendez une station avant et finissez à pied pour intégrer de l\'activité physique.',
      tags: ['Santé', 'Marche', 'Flexibilité'],
      color: '#ffd93d'
    },
    {
      icon: '⏰',
      title: 'Anticipez les retards',
      description: 'Partez 10 minutes plus tôt pour ne pas courir. Le stress vient souvent de la pression temporelle.',
      tags: ['Organisation', 'Horaires'],
      color: '#ff4d6a'
    }
  ];
}
