import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkMode = new BehaviorSubject<boolean>(true);
  isDarkMode$ = this.darkMode.asObservable();

  constructor() {
    // Charger le thème sauvegardé
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      this.darkMode.next(savedTheme === 'dark');
    }
    this.applyTheme();
  }

  toggleTheme(): void {
    this.darkMode.next(!this.darkMode.value);
    this.applyTheme();
  }

  private applyTheme(): void {
    const isDark = this.darkMode.value;
    if (isDark) {
      document.body.classList.remove('light-theme');
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
      document.body.classList.add('light-theme');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }

  isDark(): boolean {
    return this.darkMode.value;
  }
}
