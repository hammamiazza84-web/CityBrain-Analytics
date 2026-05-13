import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { Model, ModelSelectionService } from '../../../services/model-selection.service';

@Component({
  selector: 'app-model-selector',
  template: `
    <div class="model-selector-wrapper">
      <label class="selector-label">
        <span class="label-text">{{ label }}</span>
        <select 
          (change)="onModelChange($event)"
          [value]="selectedModel?.id || ''"
          class="model-select"
          [disabled]="disabled">
          <option value="">-- Sélectionner un modèle --</option>
          <option *ngFor="let model of availableModels" [value]="model.id">
            {{ model.name }} 
            <span *ngIf="model.accuracy">({{ (model.accuracy * 100).toFixed(0) }}%)</span>
          </option>
        </select>
      </label>
      
      <div *ngIf="selectedModel" class="selected-model-info">
        <p class="info-desc">{{ selectedModel.description }}</p>
        <div class="info-stats" *ngIf="selectedModel.accuracy">
          <span class="stat-badge">Précision: {{ (selectedModel.accuracy * 100).toFixed(1) }}%</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .model-selector-wrapper {
      margin: 1rem 0;
    }

    .selector-label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: var(--c-text);
      cursor: pointer;
    }

    .label-text {
      display: block;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
    }

    .model-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border);
      border-radius: 6px;
      background: var(--card);
      color: var(--c-text);
      font-size: 0.95rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .model-select:hover:not(:disabled) {
      border-color: #00c2ff;
    }

    .model-select:focus {
      outline: none;
      border-color: #0084d4;
      box-shadow: 0 0 0 3px rgba(0, 132, 212, 0.1);
    }

    .model-select:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .selected-model-info {
      margin-top: 0.75rem;
      padding: 0.75rem;
      background: rgba(0, 132, 212, 0.05);
      border-left: 3px solid #0084d4;
      border-radius: 4px;
    }

    .info-desc {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: var(--c-text2);
    }

    .info-stats {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .stat-badge {
      display: inline-block;
      padding: 0.35rem 0.75rem;
      background: #22c55e;
      color: white;
      border-radius: 4px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    body.light-theme .model-select {
      background: #ffffff;
      color: #0f1419;
      border-color: #cbd5e0;
    }

    body.light-theme .selector-label {
      color: #0f1419;
    }

    body.light-theme .label-text {
      color: #0f1419;
    }

    body.light-theme .selected-model-info {
      background: rgba(0, 132, 212, 0.08);
    }

    body.light-theme .info-desc {
      color: #5a6376;
    }
  `]
})
export class ModelSelectorComponent implements OnInit {
  @Input() section!: string;
  @Input() label: string = 'Sélectionner un modèle';
  @Input() disabled: boolean = false;
  @Output() modelSelected = new EventEmitter<Model>();

  availableModels: Model[] = [];
  selectedModel: Model | undefined;

  constructor(private modelSelectionService: ModelSelectionService) { }

  ngOnInit(): void {
    this.loadModels();
    this.modelSelectionService.selectedModels$.subscribe(() => {
      this.selectedModel = this.modelSelectionService.getSelectedModel(this.section);
    });
  }

  loadModels(): void {
    this.availableModels = this.modelSelectionService.getModelsBySection(this.section)
      .sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
    this.selectedModel = this.modelSelectionService.getSelectedModel(this.section);
  }

  onModelChange(event: any): void {
    const modelId = event.target.value;
    if (modelId) {
      const model = this.availableModels.find(m => m.id === modelId);
      if (model) {
        this.modelSelectionService.setSelectedModel(this.section, model);
        this.modelSelected.emit(model);
      }
    }
  }
}
