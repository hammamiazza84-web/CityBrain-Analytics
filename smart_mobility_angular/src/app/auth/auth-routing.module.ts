import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from '../components/auth/login/login.component';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'callback', component: LoginComponent }  // Gère le retour OAuth
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
