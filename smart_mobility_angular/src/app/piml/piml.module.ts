import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { SharedModule } from '../shared/shared.module';

// PIML Components
import { PimlCComponent } from '../components/piml/piml-c/piml-c.component';
import { PimlDComponent } from '../components/piml/piml-d/piml-d.component';
import { PimlEComponent } from '../components/piml/piml-e/piml-e.component';
import { PimlFComponent } from '../components/piml/piml-f/piml-f.component';
import { PimlGComponent } from '../components/piml/piml-g/piml-g.component';

// Services
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';

const routes: Routes = [
  { path: 'c', component: PimlCComponent, canActivate: [AuthGuard] },
  { path: 'd', component: PimlDComponent, canActivate: [AuthGuard] },
  { path: 'e', component: PimlEComponent, canActivate: [AuthGuard] },
  { path: 'f', component: PimlFComponent, canActivate: [AuthGuard] },
  { path: 'g', component: PimlGComponent, canActivate: [AuthGuard] }
];

@NgModule({
  declarations: [
    PimlCComponent,
    PimlDComponent,
    PimlEComponent,
    PimlFComponent,
    PimlGComponent
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
export class PimlModule { }
