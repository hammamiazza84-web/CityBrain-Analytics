import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, interval, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap, startWith, tap } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApiService } from './api.service';

export interface ApplicationContext {
  transportDelays?: {
    current: number;
    status: 'on-time' | 'delayed' | 'critical';
    affectedLines: string[];
    predictedImprovements: string;
  };
  stressLevel?: {
    current: number;
    trend: 'improving' | 'stable' | 'worsening';
    mainFactors: string[];
    recommendations: string[];
  };
  co2Impact?: {
    todayEmissions: number;
    weeklyTrend: number;
    comparison: string;
    recommendations: string[];
  };
  infraStatus?: {
    overallHealth: number;
    maintenanceNeeded: string[];
    energyUsage: number;
    optimizations: string[];
  };
  weather?: {
    current: {
      temperature: number;
      condition: string;
      humidity: number;
      windSpeed: number;
    };
    forecast: Array<{
      time: string;
      temp: number;
      condition: string;
      impact: string;
    }>;
  };
  activeAlerts?: Array<{
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    message: string;
    affectedAreas: string[];
  }>;
  userStats?: {
    totalTrips: number;
    co2Saved: number;
    pointsBalance: number;
    activeDefis: string[];
    achievements: string[];
  };
  predictions?: {
    nextHourTraffic: string;
    peakTimes: string[];
    recommendedTravelTime: string;
    alternativeRoutes: string[];
  };
  rankings?: {
    userRank: number;
    scorePercentile: number;
    monthlyChampions: string[];
    nextLevelPoints: number;
  };
  lastUpdated: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ApplicationContextService {
  private contextSubject = new BehaviorSubject<ApplicationContext>({
    lastUpdated: new Date()
  });

  public context$ = this.contextSubject.asObservable();
  private refreshInterval = 60000;

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {
    // Ne pas démarrer le refresh automatique au démarrage
    // Il sera déclenché après connexion via refreshNow()
  }

  getFullContext(): Observable<ApplicationContext> {
    return this.fetchAllData().pipe(
      tap(context => {
        this.contextSubject.next(context);
      })
    );
  }

  private fetchAllData(): Observable<ApplicationContext> {
    return forkJoin({
      transportDelays: this.fetchTransportData().pipe(catchError(() => of(undefined))),
      stressLevel:     this.fetchStressData().pipe(catchError(() => of(undefined))),
      co2Impact:       this.fetchCO2Data().pipe(catchError(() => of(undefined))),
      infraStatus:     this.fetchInfraData().pipe(catchError(() => of(undefined))),
      weather:         this.fetchWeatherData().pipe(catchError(() => of(undefined))),
      activeAlerts:    of([]),
      userStats:       of(undefined),
      predictions:     of(undefined),
      rankings:        of(undefined)
    }).pipe(
      map(data => ({
        ...data,
        lastUpdated: new Date()
      }))
    );
  }

  // Utilise les endpoints du vrai app.py
  private fetchTransportData(): Observable<ApplicationContext['transportDelays']> {
    return this.http.get(`${environment.apiUrl}/transport/summary`).pipe(
      map((r: any) => ({
        current: r.avg_delay || 0,
        status: (r.avg_delay > 10 ? 'critical' : r.avg_delay > 5 ? 'delayed' : 'on-time') as 'on-time' | 'delayed' | 'critical',
        affectedLines: [],
        predictedImprovements: 'Amélioration attendue dans 2h'
      }))
    );
  }

  private fetchStressData(): Observable<ApplicationContext['stressLevel']> {
    return this.http.get(`${environment.apiUrl}/stress/summary`).pipe(
      map((r: any) => ({
        current: Math.round((r.avg_stress || 2.5) * 20),
        trend: 'stable' as 'stable',
        mainFactors: ['Congestion routière', 'Affluence transports'],
        recommendations: ['Privilégier transport en commun', 'Éviter les heures de pointe']
      }))
    );
  }

  private fetchCO2Data(): Observable<ApplicationContext['co2Impact']> {
    return this.http.get(`${environment.apiUrl}/env/summary`).pipe(
      map((r: any) => ({
        todayEmissions: r.avg_co2 || 0,
        weeklyTrend: 0,
        comparison: 'vs moyenne ville',
        recommendations: ['Utiliser les transports en commun']
      }))
    );
  }

  private fetchInfraData(): Observable<ApplicationContext['infraStatus']> {
    return this.http.get(`${environment.apiUrl}/infra/summary`).pipe(
      map((r: any) => ({
        overallHealth: 85,
        maintenanceNeeded: [],
        energyUsage: r.avg_energy || 0,
        optimizations: []
      }))
    );
  }

  private fetchWeatherData(): Observable<ApplicationContext['weather']> {
    return this.apiService.getRealtimeWeather('Paris').pipe(
      map((r: any) => ({
        current: {
          temperature: r.temperature || 20,
          condition: r.condition || 'Nuageux',
          humidity: r.humidity || 60,
          windSpeed: r.wind_speed || 10
        },
        forecast: []
      }))
    );
  }

  private startAutoRefresh(): void {
    interval(this.refreshInterval).pipe(
      startWith(0),
      switchMap(() => this.getFullContext().pipe(catchError(() => of(null))))
    ).subscribe();
  }

  getContextSummary(): string {
    const ctx = this.contextSubject.value;
    let s = '📊 Contexte Smart Mobility:\n\n';

    if (ctx.transportDelays) {
      s += `🚌 Transport: Retard moyen ${ctx.transportDelays.current} min (${ctx.transportDelays.status})\n\n`;
    }
    if (ctx.stressLevel) {
      s += `😟 Stress urbain: ${ctx.stressLevel.current}/100 (${ctx.stressLevel.trend})\n\n`;
    }
    if (ctx.co2Impact) {
      s += `🌿 CO2: ${ctx.co2Impact.todayEmissions} kg aujourd'hui\n\n`;
    }
    if (ctx.weather) {
      s += `🌤️ Météo: ${ctx.weather.current.temperature}°C, ${ctx.weather.current.condition}\n\n`;
    }

    s += `⏰ Mis à jour: ${ctx.lastUpdated.toLocaleTimeString()}`;
    return s;
  }

  refreshNow(): Observable<ApplicationContext> {
    return this.getFullContext();
  }
}
