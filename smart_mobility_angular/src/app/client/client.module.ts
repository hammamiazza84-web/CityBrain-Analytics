import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

// Client Components
import { ClientLayoutComponent } from '../components/client/client-layout/client-layout.component';
import { ClientNavbarComponent } from '../components/client/client-navbar/client-navbar.component';
import { ClientHomeComponent } from '../components/client/client-home/client-home.component';
import { ClientStressComponent } from '../components/client/client-stress/client-stress.component';
import { ClientTipsComponent } from '../components/client/client-tips/client-tips.component';
import { ClientTransportComponent } from '../components/client/client-transport/client-transport.component';
import { ClientCarbonComponent } from '../components/client/client-carbon/client-carbon.component';
import { ClientAlertsComponent } from '../components/client/client-alerts/client-alerts.component';
import { ClientRoutesComponent } from '../components/client/client-routes/client-routes.component';
import { ClientWeatherComponent } from '../components/client/client-weather/client-weather.component';
import { ClientAiChatComponent } from '../components/client/client-ai-chat/client-ai-chat.component';
import { ClientMapsComponent } from '../components/client/client-maps/client-maps.component';

// Services & Guards
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { AuthGuard } from '../guards/auth.guard';
import { AiAssistantEnhancedService } from '../services/ai-assistant-enhanced.service';
import { TomTomTrafficService } from '../services/tomtom-traffic.service';
import { FormatMessagePipe } from '../pipes/format-message.pipe';
import { SharedModule } from '../shared/shared.module';

const routes: Routes = [
  {
    path: '',
    component: ClientLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'home', pathMatch: 'full' },
      { path: 'home', component: ClientHomeComponent },
      { path: 'maps', component: ClientMapsComponent },
      { path: 'stress', component: ClientStressComponent },
      { path: 'tips', component: ClientTipsComponent },
      { path: 'transport', component: ClientTransportComponent },
      { path: 'carbon', component: ClientCarbonComponent },
      { path: 'alerts', component: ClientAlertsComponent },
      { path: 'routes', component: ClientRoutesComponent },
      { path: 'weather', component: ClientWeatherComponent }
    ]
  }
];

@NgModule({
  declarations: [
    ClientLayoutComponent,
    ClientNavbarComponent,
    ClientHomeComponent,
    ClientStressComponent,
    ClientTipsComponent,
    ClientTransportComponent,
    ClientCarbonComponent,
    ClientAlertsComponent,
    ClientRoutesComponent,
    ClientWeatherComponent,
    ClientAiChatComponent,
    ClientMapsComponent
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
    AuthGuard,
    AiAssistantEnhancedService,
    TomTomTrafficService
  ]
})
export class ClientModule { }
