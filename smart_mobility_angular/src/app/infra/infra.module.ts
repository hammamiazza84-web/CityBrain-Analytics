import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// Infrastructure Components
import { InfraClfComponent } from '../components/infra/infra-clf/infra-clf.component';
import { InfraRegComponent } from '../components/infra/infra-reg/infra-reg.component';
import { InfraCluComponent } from '../components/infra/infra-clu/infra-clu.component';
import { InfraTsComponent } from '../components/infra/infra-ts/infra-ts.component';
import { InfraAnomalyComponent } from '../components/infra/infra-anomaly/infra-anomaly.component';

// Services
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: 'clf', component: InfraClfComponent, canActivate: [AuthGuard] },
  { path: 'reg', component: InfraRegComponent, canActivate: [AuthGuard] },
  { path: 'clu', component: InfraCluComponent, canActivate: [AuthGuard] },
  { path: 'ts', component: InfraTsComponent, canActivate: [AuthGuard] },
  { path: 'anomaly', component: InfraAnomalyComponent, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [
    InfraClfComponent,
    InfraRegComponent,
    InfraCluComponent,
    InfraTsComponent,
    InfraAnomalyComponent
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
export class InfraModule { }
