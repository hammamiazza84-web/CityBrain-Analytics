import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { environment } from '@env/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error: string | null = null;
  info: string | null = null;
  loading = false;
  loadingGoogle = false;
  loadingForgot = false;
  showQuickAccess = !environment.production;
  private readonly deciderEmails = new Set(
    environment.auth.googleDeciderEmails.map((e) => String(e).toLowerCase())
  );

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Debug: Afficher l'URL complète
    console.log('[Login] URL complète:', window.location.href);
    console.log('[Login] Chemin:', this.route.snapshot.url);
    
    // Essayer queryParamMap d'abord
    const paramMap = this.route.snapshot.queryParamMap;
    
    // Essayer aussi queryParams (plus fiable pour certains cas)
    const queryParams = this.route.snapshot.queryParams;
    
    console.log('[Login] queryParamMap:', {
      token: paramMap.get('token'),
      email: paramMap.get('email'),
      role: paramMap.get('role')
    });
    
    console.log('[Login] queryParams:', queryParams);
    
    // Gérer le callback OAuth (Google) - essayer les deux sources
    const token = paramMap.get('token') || queryParams['token'] || paramMap.get('access_token') || queryParams['access_token'];
    const email = (paramMap.get('email') || queryParams['email'] || '').trim().toLowerCase();
    const role = paramMap.get('role') || queryParams['role'] || 'client';
    
    console.log('[Login] Valeurs extraites:', { token: token ? 'présent' : 'absent', email, role });
    
    if (!token || !email) {
      console.log('[Login] Pas de token/email - affichage page login normale');
      return;
    }

    console.log('[Login] Callback OAuth détecté! Connexion en cours...');
    
    // Compléter la connexion
    this.authService.completeExternalLogin(token, email, role);
    
    // Vérifier que la session est bien enregistrée
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    
    console.log('[Login] Session sauvegardée dans localStorage:', { 
      user: savedUser ? 'OK' : 'NON', 
      token: savedToken ? 'OK' : 'NON' 
    });
    
    // Vérifier que isLoggedIn fonctionne
    const isLoggedIn = this.authService.isLoggedIn();
    console.log('[Login] isLoggedIn():', isLoggedIn);
    
    // Rediriger tout le monde vers l'interface client selon la demande
    const redirectPath = '/client/home';
    
    console.log('[Login] Navigation vers:', redirectPath);
    
    // Attendre un peu plus longtemps pour s'assurer que tout est bien propagé
    setTimeout(() => {
      console.log('[Login] Exécution de la navigation...');
      this.router.navigate([redirectPath]).then(
        (success) => console.log('[Login] Navigation réussie:', success),
        (error) => console.error('[Login] Erreur navigation:', error)
      );
    }, 1000);
  }

  login(): void {
    const email = this.email.trim();
    const password = this.password.trim();
    
    if (!email || !password) {
      this.error = 'Veuillez entrer votre email et mot de passe';
      return;
    }

    this.loading = true;
    this.error = null;
    this.info = null;

    this.authService.login(email, password).subscribe({
      next: (response: any) => {
        this.loading = false;
        const userRole = (
          response?.user?.role ||
          response?.data?.user?.role ||
          response?.role ||
          ''
        ).trim();
        const r = userRole.toLowerCase();
        const target = '/client/home';
        console.log('[Login] Success! Redirecting to', target, 'for role:', userRole);
        this.router.navigate([target]);
      },
      error: (err) => {
        this.loading = false;
        if (err?.status === 0) {
          this.error = 'Impossible de joindre le serveur d’authentification. Vérifiez que le backend est démarré sur localhost:5001.';
        } else {
          this.error = err?.error?.error || err?.message || 'Échec de la connexion. Vérifiez vos identifiants.';
        }
      }
    });
  }

  continueWithGoogle(): void {
    this.loadingGoogle = true;
    this.error = null;
    this.info = null;
    // OAuth doit être lancé par redirection navigateur, pas via XHR/fetch.
    window.location.href = this.authService.getGoogleAuthUrl();
  }

  forgotPassword(): void {
    const email = this.email.trim();
    if (!email) {
      this.error = 'Entrez votre email pour recevoir un lien de réinitialisation.';
      this.info = null;
      return;
    }

    this.loadingForgot = true;
    this.error = null;
    this.info = null;

    this.authService.forgotPassword(email).subscribe({
      next: (response: any) => {
        this.loadingForgot = false;
        console.log('[ForgotPassword] Réponse:', response);
        
        if (response.reset_token) {
          // Mode développement : afficher le token
          this.info = `✅ Mot de passe temporaire généré : ${response.reset_token}`;
          this.email = email; // Garder l'email pour faciliter la connexion
          this.password = response.reset_token; // Pré-remplir le mot de passe
        } else {
          this.info = 'Si ce compte existe, un email de réinitialisation a été envoyé.';
        }
      },
      error: (err) => {
        this.loadingForgot = false;
        console.error('[ForgotPassword] Erreur:', err);
        
        if (err?.status === 0) {
          this.error = 'Impossible de joindre le serveur. Vérifiez que le backend est démarré sur localhost:5001.';
        } else if (err?.status === 404 || err?.status === 405) {
          this.error = 'La fonctionnalité "mot de passe oublié" n\'est pas activée côté backend.';
        } else {
          this.error = err?.error?.error || err?.message || 'Impossible d\'envoyer la demande de réinitialisation.';
        }
      }
    });
  }

  quickLogin(role: string): void {
    const credentials: { [key: string]: { email: string; password: string } } = {
      manager: { email: 'manager@smartmobility.ai', password: 'manager123' },
      urban: { email: 'urban@smartmobility.ai', password: 'urban123' },
      client: { email: 'client@smartmobility.ai', password: 'client123' },
      env: { email: 'env@smartmobility.ai', password: 'env123' }
    };
    
    const cred = credentials[role];
    if (cred) {
      this.email = cred.email;
      this.password = cred.password;
      this.login();
    }
  }
}
