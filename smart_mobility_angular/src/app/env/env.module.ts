import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// Environment Components
import { EnvCo2Component } from '../components/env/env-co2/env-co2.component';

// Services
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: 'co2', component: EnvCo2Component, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [
    EnvCo2Component
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
export class EnvModule { }
