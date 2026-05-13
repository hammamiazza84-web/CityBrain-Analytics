import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: any): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    // Vérifier l'authentification (isLoggedIn gère aussi la restauration depuis localStorage)
    if (this.authService.isLoggedIn()) {
      console.log('[AuthGuard] Utilisateur authentifié');
      return true;
    }
    
    // Si on est sur la page de login avec des paramètres OAuth, laisser passer
    const url = window.location.href;
    if (url.includes('/login') && (url.includes('token=') || url.includes('code='))) {
      console.log('[AuthGuard] Page login avec paramètres OAuth - accès autorisé');
      return true;
    }
    
    console.log('[AuthGuard] Non authentifié, redirection vers login');
    // Redirect to login page
    return this.router.createUrlTree(['/login']);
  }
}
