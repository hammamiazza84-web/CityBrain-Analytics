import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// Transport Components
import { TransportRetardComponent } from '../components/transport/transport-retard/transport-retard.component';
import { TransportAnomalyComponent } from '../components/transport/transport-anomaly/transport-anomaly.component';
import { TransportClfComponent } from '../components/transport/transport-clf/transport-clf.component';
import { TransportClusterComponent } from '../components/transport/transport-cluster/transport-cluster.component';
import { TransportTsComponent } from '../components/transport/transport-ts/transport-ts.component';

// Services
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: 'retard', component: TransportRetardComponent, canActivate: [AuthGuard] },
  { path: 'anomaly', component: TransportAnomalyComponent, canActivate: [AuthGuard] },
  { path: 'clf', component: TransportClfComponent, canActivate: [AuthGuard] },
  { path: 'cluster', component: TransportClusterComponent, canActivate: [AuthGuard] },
  { path: 'ts', component: TransportTsComponent, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [
    TransportRetardComponent,
    TransportAnomalyComponent,
    TransportClfComponent,
    TransportClusterComponent,
    TransportTsComponent
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
export class TransportModule { }
