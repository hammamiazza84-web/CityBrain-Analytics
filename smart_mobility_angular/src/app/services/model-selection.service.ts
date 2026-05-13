import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Model {
  id: string;
  name: string;
  section: string;
  description: string;
  accuracy?: number;
  isSelected?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ModelSelectionService {
  // Meilleurs modèles uniquement (éliminé les modèles non performants)
  private models: Model[] = [
    // Stress Models - Meilleur: XGBoost (89%)
    { id: 'stress-xgboost', name: 'Stress Classification (XGBoost)', section: 'stress', description: 'Classification du stress avec XGBoost', accuracy: 0.89, isSelected: true },

    // Transport Models - Meilleur: Anomalie Detection (88%)
    { id: 'transport-anomaly', name: 'Transport Anomalie Detection', section: 'transport', description: 'Détection d\'anomalies transport', accuracy: 0.88, isSelected: true },

    // Infrastructure Models - Meilleur: Classification (91%)
    { id: 'infra-clf', name: 'Infrastructure Classification', section: 'infra', description: 'Classification infrastructure', accuracy: 0.91, isSelected: true },

    // PIML Models - Meilleur: Classification (86%)
    { id: 'piml-c', name: 'PIML Classification', section: 'piml', description: 'Classification PIML', accuracy: 0.86, isSelected: true },

    // Environment Models - Meilleur: CO2 Environment (90%)
    { id: 'env-co2', name: 'CO2 Environment', section: 'env', description: 'Prédiction CO2', accuracy: 0.90, isSelected: true },

    // Anomaly Detection - Meilleur: ISO + SVM (92%)
    { id: 'anomaly-iso', name: 'Anomalie Detection (ISO + SVM)', section: 'anomaly', description: 'Détection d\'anomalies', accuracy: 0.92, isSelected: true }
  ];

  private selectedModelsSubject = new BehaviorSubject<Map<string, Model>>(this.getSelectedModels());
  public selectedModels$ = this.selectedModelsSubject.asObservable();

  constructor() {
    this.loadSelectedModels();
  }

  private getSelectedModels(): Map<string, Model> {
    const selected = new Map<string, Model>();
    this.models.forEach(model => {
      // Seulement un modèle par section (le meilleur)
      if (model.isSelected) {
        selected.set(model.section, model);
      }
    });
    return selected;
  }

  private loadSelectedModels(): void {
    // Les modèles meilleurs sont chargés par défaut
    // localStorage n'est pas utilisé car les meilleurs modèles sont fixes
  }

  getModelsBySection(section: string): Model[] {
    // Retourner le meilleur modèle uniquement
    return this.models.filter(m => m.section === section && m.isSelected);
  }

  getSelectedModel(section: string): Model | undefined {
    // Retourner le seul modèle de cette section (le meilleur)
    return this.models.find(m => m.section === section && m.isSelected);
  }

  setSelectedModel(section: string, model: Model): void {
    // Ne pas permettre de changer - garder le meilleur modèle
    console.log(`Modèle ${model.name} est le meilleur pour ${section}`);
  }

  getAllModels(): Model[] {
    // Retourner tous les meilleurs modèles
    return this.models.filter(m => m.isSelected);
  }

  getBestModelForSection(section: string): Model | undefined {
    return this.getSelectedModel(section);
  }

  getAllSections(): string[] {
    return Array.from(new Set(this.models.map(m => m.section)));
  }

  private updateSelectedModels(): void {
    const selected = this.getSelectedModels();
    this.selectedModelsSubject.next(selected);
  }
}
