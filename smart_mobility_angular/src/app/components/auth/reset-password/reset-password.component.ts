import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  error: string | null = null;
  info: string | null = null;
  loading = false;

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.token = params.get('token') || '';
      if (!this.token) {
        this.error = 'Le token de réinitialisation est manquant. Vérifiez le lien reçu par email.';
      }
    });
  }

  resetPassword(): void {
    this.error = null;
    this.info = null;

    if (!this.token) {
      this.error = 'Token invalide ou absent.';
      return;
    }

    if (!this.password || !this.confirmPassword) {
      this.error = 'Veuillez entrer et confirmer votre nouveau mot de passe.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.error = 'Les deux mots de passe doivent être identiques.';
      return;
    }

    if (this.password.length < 8) {
      this.error = 'Le mot de passe doit contenir au moins 8 caractères.';
      return;
    }

    this.loading = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.info = 'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.';
        setTimeout(() => this.goToLogin(), 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.error || err?.message || 'Impossible de réinitialiser le mot de passe.';
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
