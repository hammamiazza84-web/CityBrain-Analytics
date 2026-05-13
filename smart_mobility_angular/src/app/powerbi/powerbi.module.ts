import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// PowerBI Components
import { PowerbiDashboardComponent } from '../components/powerbi/powerbi-dashboard/powerbi-dashboard.component';

// Services
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: 'dashboard', component: PowerbiDashboardComponent, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [
    PowerbiDashboardComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule.forChild(routes),
    SharedModule
  ],
  providers: [
    ApiService,
    AuthService,
    AuthGuard
  ]
})
export class PowerbiModule { }
