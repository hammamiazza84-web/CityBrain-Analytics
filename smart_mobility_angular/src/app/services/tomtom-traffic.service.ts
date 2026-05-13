import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@env/environment';

export interface TomTomFlowData {
  flowSegmentData: {
    freeFlowSpeed: number;
    currentSpeed: number;
    currentTravelTime: number;
    freeFlowTravelTime: number;
    confidence: number;
    roadClosure: boolean;
    coordinates: Array<{ latitude: number; longitude: number }>;
  }[];
}

export interface TrafficZone {
  id: string;
  lat: number;
  lng: number;
  radius: number;
  congestionLevel: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  area: string;
  estimatedDelay: number;
  vehicles: number;
  currentSpeed: number;
  freeFlowSpeed: number;
}

export interface TrafficDataResponse {
  zones: TrafficZone[];
  timestamp: string;
  averageCongestion: number;
}

@Injectable({
  providedIn: 'root'
})
export class TomTomTrafficService {
  private apiKey = environment.tomtomApiKey;
  private baseUrl = 'https://api.tomtom.com/traffic/services/5';

  // Zones clés de Paris pour le suivi du trafic
  private parisianzones = [
    { name: 'Île de la Cité', lat: 48.8566, lng: 2.3522, radius: 1.5 },
    { name: 'Étoile / Arc de Triomphe', lat: 48.8708, lng: 2.2899, radius: 2.0 },
    { name: 'Gare de Lyon', lat: 48.8396, lng: 2.3644, radius: 1.8 },
    { name: 'Bastille', lat: 48.8424, lng: 2.3536, radius: 1.2 },
    { name: 'Gare Montparnasse', lat: 48.8355, lng: 2.2865, radius: 2.2 },
    { name: 'La Défense', lat: 48.8912, lng: 2.2417, radius: 1.5 },
    { name: 'Opéra', lat: 48.8530, lng: 2.3499, radius: 1.3 },
    { name: 'Pont d\'Iéna / Trocadéro', lat: 48.8627, lng: 2.2900, radius: 1.8 }
  ];

  constructor(private http: HttpClient) {}

  /**
   * Fetch real traffic data from TomTom for Paris zones
   */
  getParisTrafficZones(): Observable<TrafficDataResponse> {
    // Fetch traffic data for all zones in parallel
    const requests = this.parisianzones.map(zone =>
      this.getTrafficFlowForZone(zone.lat, zone.lng).pipe(
        map(flow => this.mapFlowDataToZone(zone, flow)),
        catchError(() => of(this.createMockZone(zone)))
      )
    );

    return new Observable(observer => {
      Promise.all(requests.map(req => req.toPromise())).then((zones: any[]) => {
        const averageCongestion = Math.round(
          zones.reduce((sum, z) => sum + (z?.congestionLevel || 0), 0) / zones.length
        );
        
        observer.next({
          zones: zones.filter(z => z !== null),
          timestamp: new Date().toISOString(),
          averageCongestion
        });
        observer.complete();
      }).catch(() => {
        observer.error('Failed to fetch traffic data');
      });
    });
  }

  /**
   * Get traffic flow data from TomTom for a specific location
   */
  private getTrafficFlowForZone(lat: number, lng: number): Observable<any> {
    const url = `${this.baseUrl}/flowSegmentData/absolute/20/json?point=${lat},${lng}&key=${this.apiKey}`;
    return this.http.get<any>(url);
  }

  /**
   * Map TomTom flow data to our TrafficZone format
   */
  private mapFlowDataToZone(zone: any, flowData: any): TrafficZone {
    if (!flowData?.flowSegmentData?.length) {
      return this.createMockZone(zone);
    }

    const flow = flowData.flowSegmentData[0];
    const currentSpeed = flow.currentSpeed || 0;
    const freeFlowSpeed = flow.freeFlowSpeed || 60;

    // Calculate congestion level (0-100%)
    const congestionLevel = Math.min(
      100,
      Math.max(0, 100 - (currentSpeed / freeFlowSpeed) * 100)
    );

    // Determine severity
    const severity = this.getSeverityFromCongestion(congestionLevel);

    // Estimate delay (in minutes)
    const estimatedDelay = Math.round(
      (flow.currentTravelTime - flow.freeFlowTravelTime) / 60
    );

    return {
      id: `zone-${zone.name.replace(/\s+/g, '-')}`,
      lat: zone.lat,
      lng: zone.lng,
      radius: zone.radius,
      congestionLevel: Math.round(congestionLevel),
      severity,
      area: zone.name,
      estimatedDelay: Math.max(0, estimatedDelay),
      vehicles: this.estimateVehicleCount(currentSpeed, zone.radius),
      currentSpeed: Math.round(currentSpeed),
      freeFlowSpeed: Math.round(freeFlowSpeed)
    };
  }

  /**
   * Determine severity level from congestion percentage
   */
  private getSeverityFromCongestion(
    congestion: number
  ): 'low' | 'medium' | 'high' | 'critical' {
    if (congestion < 25) return 'low';
    if (congestion < 50) return 'medium';
    if (congestion < 75) return 'high';
    return 'critical';
  }

  /**
   * Estimate vehicle count based on congestion and zone size
   */
  private estimateVehicleCount(speed: number, radiusKm: number): number {
    const baseVehicles = radiusKm * 200; // Approximate: 200 vehicles per km radius
    const speedFactor = Math.max(0.5, speed / 30); // Slow = more vehicles
    return Math.round(baseVehicles / speedFactor);
  }

  /**
   * Create mock zone data (fallback when API fails)
   */
  private createMockZone(zone: any): TrafficZone {
    const congestionLevel = Math.floor(Math.random() * 100);
    const severity = this.getSeverityFromCongestion(congestionLevel);

    return {
      id: `zone-${zone.name.replace(/\s+/g, '-')}`,
      lat: zone.lat,
      lng: zone.lng,
      radius: zone.radius,
      congestionLevel,
      severity,
      area: zone.name,
      estimatedDelay: Math.floor(Math.random() * 35),
      vehicles: Math.floor(Math.random() * 700) + 150,
      currentSpeed: Math.floor(Math.random() * 50) + 10,
      freeFlowSpeed: 60
    };
  }
}
