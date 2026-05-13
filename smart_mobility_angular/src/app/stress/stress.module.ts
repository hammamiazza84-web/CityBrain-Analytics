import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// Stress Components
import { StressPredictComponent } from '../components/stress/stress-predict/stress-predict.component';
import { StressAnomalyComponent } from '../components/stress/stress-anomaly/stress-anomaly.component';
import { StressRecommendComponent } from '../components/stress/stress-recommend/stress-recommend.component';

// Services
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: 'predict', component: StressPredictComponent, canActivate: [AuthGuard] },
  { path: 'anomaly', component: StressAnomalyComponent, canActivate: [AuthGuard] },
  { path: 'recommend', component: StressRecommendComponent, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [
    StressPredictComponent,
    StressAnomalyComponent,
    StressRecommendComponent
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
export class StressModule { }
