import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '@env/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private weatherApiUrl = environment.weatherApiUrl;

  constructor(private http: HttpClient) { }

  private handleError(error: any) {
    console.error('API Error:', error);
    return throwError(() => error.error?.message || error.message || 'Server error');
  }

  // ═══════════════════════════════════════════════════════════════
  // STRESS API
  // ═══════════════════════════════════════════════════════════════
  
  predictStress(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/stress/predict`, data).pipe(
      catchError(this.handleError)
    );
  }

  detectAnomaly(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/stress/anomaly`, data).pipe(
      catchError(this.handleError)
    );
  }

  getRecommendations(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/stress/recommend`, data).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // TRANSPORT API
  // ═══════════════════════════════════════════════════════════════
  
  predictRetard(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transport/predict`, data).pipe(
      catchError(this.handleError)
    );
  }

  classifyTransport(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transport/classify`, data).pipe(
      catchError(this.handleError)
    );
  }

  detectTransportAnomaly(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/transport/anomaly`, data).pipe(
      catchError(this.handleError)
    );
  }

  getTransportAnomalies(): Observable<any> {
    return this.http.get(`${this.apiUrl}/transport/anomaly_batch`).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // INFRASTRUCTURE API
  // ═══════════════════════════════════════════════════════════════
  
  predictInfraClf(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/infra/predict_classification`, data).pipe(
      catchError(this.handleError)
    );
  }

  predictInfraReg(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/infra/predict_regression`, data).pipe(
      catchError(this.handleError)
    );
  }

  predictInfraCluster(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/infra/predict_clustering`, data).pipe(
      catchError(this.handleError)
    );
  }

  predictInfraTs(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/infra/predict_timeseries`, data).pipe(
      catchError(this.handleError)
    );
  }

  predictInfraAnomaly(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/infra/predict_anomaly`, data).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PIML API
  // ═══════════════════════════════════════════════════════════════
  
  pimlPredict(section: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/piml/${section}/predict`, data).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // ENVIRONMENT API
  // ═══════════════════════════════════════════════════════════════
  
  predictCo2(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/env/predict_co2`, data).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // WEATHER API - Toutes les options météo
  // ═══════════════════════════════════════════════════════════════
  
  getRealtimeWeather(city: string = 'Tunis'): Observable<any> {
    // Nouvelle méthode pour les données météo réelles
    return this.http.get(`${this.weatherApiUrl}/weather/realtime?city=${city}`).pipe(
      catchError(this.handleError)
    );
  }
  
  getWeatherForecast(city: string = 'Tunis'): Observable<any> {
    // Prévisions météo réelles sur 5 jours
    return this.http.get(`${this.weatherApiUrl}/weather/forecast?city=${city}`).pipe(
      catchError(this.handleError)
    );
  }
  
  getPastWeather(city: string = 'Tunis', days: number = 5): Observable<any> {
    // Historique météo réel des jours précédents
    return this.http.get(`${this.weatherApiUrl}/weather/past?city=${city}&days=${days}`).pipe(
      catchError(this.handleError)
    );
  }
  
  getWeatherByCoordinates(lat: number, lon: number): Observable<any> {
    // Météo par coordonnées GPS
    return this.http.get(`${this.weatherApiUrl}/weather/coordinates?lat=${lat}&lon=${lon}`).pipe(
      catchError(this.handleError)
    );
  }

  searchCities(query: string): Observable<any> {
    // Autocomplete des villes
    return this.http.get(`${this.weatherApiUrl}/weather/search?q=${query}`).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DASHBOARD / INFO
  // ═══════════════════════════════════════════════════════════════
  
  getDashboard(): Observable<any> {
    return this.http.get(`${this.apiUrl}/dashboard`).pipe(
      catchError(this.handleError)
    );
  }

  getModelsInfo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/models/info`).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // SQL SERVER DATA (ETL)
  // ═══════════════════════════════════════════════════════════════
  
  getStops(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data/stops`).pipe(
      catchError(this.handleError)
    );
  }

  getVehicles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data/vehicles`).pipe(
      catchError(this.handleError)
    );
  }

  getZones(): Observable<any> {
    return this.http.get(`${this.apiUrl}/data/zones`).pipe(
      catchError(this.handleError)
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // GENERIC API METHODS
  // ═══════════════════════════════════════════════════════════════

  get(endpoint: string): Observable<any> {
    return this.http.get(`${this.apiUrl}${endpoint}`).pipe(
      catchError(this.handleError)
    );
  }

  post(endpoint: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}${endpoint}`, data).pipe(
      catchError(this.handleError)
    );
  }
}
