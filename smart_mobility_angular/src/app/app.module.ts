import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { SidebarComponent } from './components/layout/sidebar/sidebar.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ResetPasswordComponent } from './components/auth/reset-password/reset-password.component';
import { SharedModule } from './shared/shared.module';

// Services & Guards
import { ApiService } from './services/api.service';
import { AuthService } from './services/auth.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthInterceptor } from './interceptors/auth.interceptor';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'auth/callback', loadChildren: () => import('./auth/auth.module').then(m => m.AuthModule) },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },

  // Stress module
  { path: 'stress', loadChildren: () => import('./stress/stress.module').then(m => m.StressModule) },

  // Transport module
  { path: 'transport', loadChildren: () => import('./transport/transport.module').then(m => m.TransportModule) },

  // Infrastructure module
  { path: 'infra', loadChildren: () => import('./infra/infra.module').then(m => m.InfraModule) },

  // PIML module
  { path: 'piml', loadChildren: () => import('./piml/piml.module').then(m => m.PimlModule) },

  // Environment module
  { path: 'env', loadChildren: () => import('./env/env.module').then(m => m.EnvModule) },

  // Urban Planning Director Dashboard (redirects to the main dynamic dashboard)
  { path: 'urban/dashboard', redirectTo: '/dashboard', pathMatch: 'full' },

  // Environmental Analyst Dashboard (redirects to the main dynamic dashboard)
  { path: 'env/dashboard', redirectTo: '/dashboard', pathMatch: 'full' },

  // PowerBI module
  { path: 'powerbi', loadChildren: () => import('./powerbi/powerbi.module').then(m => m.PowerbiModule) },

  // MLflow module
  { path: 'mlflow', loadChildren: () => import('./mlflow/mlflow.module').then(m => m.MlflowModule) },

  // Client module
  { path: 'client', loadChildren: () => import('./client/client.module').then(m => m.ClientModule) },

  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  declarations: [
    AppComponent,
    SidebarComponent,
    DashboardComponent,
    ResetPasswordComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    SharedModule
  ],
  providers: [
    ApiService,
    AuthService,
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
