import { Component } from '@angular/core';

@Component({
  selector: 'app-client-layout',
  template: `
    <div class="client-layout">
      <app-client-navbar></app-client-navbar>
      <main class="client-main">
        <router-outlet></router-outlet>
      </main>
      <!-- Smart Assistant Chat -->
      <app-client-ai-chat></app-client-ai-chat>
    </div>
  `,
  styles: [`
    .client-layout {
      min-height: 100vh;
      background: var(--bg);
    }
    
    .client-main {
      min-height: calc(100vh - 64px);
    }
  `]
})
export class ClientLayoutComponent {}
