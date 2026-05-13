import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '@env/environment';

interface User {
  id: number;
  email: string;
  role: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Check if user is already logged in
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        this.currentUserSubject.next(JSON.parse(savedUser));
      } catch (error) {
        console.error('[Auth] Invalid saved user data', error);
        localStorage.removeItem('currentUser');
      }
    }
  }

  private persistSession(response: any, fallbackEmail = '', forcedRole?: string): void {
    const responseData = response?.data || response;
    const token = response?.token || response?.access_token || responseData?.token || responseData?.access_token;
    const userData = response?.user || responseData?.user || responseData;

    if (!token) {
      console.warn('[Auth] Backend response without token:', response);
      return;
    }

    const user: User = {
      id: userData?.id || response?.id || responseData?.id || 0,
      email: userData?.email || response?.email || responseData?.email || fallbackEmail,
      role: forcedRole || userData?.role || response?.role || responseData?.role || 'client',
      token
    };
    console.log('[Auth] User logged in:', user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
    this.currentUserSubject.next(user);
  }

  login(email: string, password: string): Observable<any> {
    console.log('[Auth] Tentative login vers:', `${this.apiUrl}/auth/login`);
    return this.http.post(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap((response: any) => {
        this.persistSession(response, email);
      })
    );
  }

  /**
   * Lance un flux OAuth Google côté backend.
   * Le backend doit idéalement renvoyer une URL de redirection.
   */
  loginWithGoogle(): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/google`, {}, { withCredentials: true }).pipe(
      tap((response: any) => {
        this.persistSession(response);
      })
    );
  }

  getGoogleAuthUrl(): string {
    return `${this.apiUrl}/auth/google`;
  }

  /**
   * Déclenche l'envoi d'un email de réinitialisation.
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/forgot-password`,
      { email },
      { withCredentials: true }
    );
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/auth/reset-password`,
      { token, password },
      { withCredentials: true }
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    // Vérifier d'abord le BehaviorSubject
    if (!!this.currentUserSubject.value) {
      return true;
    }
    
    // Sinon, vérifier le localStorage (pour les cas où le BehaviorSubject est vide)
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken) {
      // Restaurer le BehaviorSubject à partir du localStorage
      try {
        const user = JSON.parse(savedUser);
        this.currentUserSubject.next(user);
        return true;
      } catch (e) {
        console.error('[Auth] Erreur lors de la restauration de la session:', e);
      }
    }
    
    return false;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getUserRole(): string | null {
    return this.currentUserSubject.value?.role || null;
  }

  setCurrentUserRole(role: string): void {
    const current = this.currentUserSubject.value;
    if (!current) return;
    const updated = { ...current, role };
    localStorage.setItem('currentUser', JSON.stringify(updated));
    this.currentUserSubject.next(updated);
  }

  completeExternalLogin(accessToken: string, email: string, role: string): void {
    this.persistSession(
      {
        token: accessToken,
        user: {
          id: 0,
          email,
          role
        }
      },
      email,
      role
    );
  }
}
