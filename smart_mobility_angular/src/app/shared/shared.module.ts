import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModelSelectorComponent } from '../components/layout/model-selector/model-selector.component';
import { AiChatbotComponent } from '../components/ai/ai-chatbot/ai-chatbot.component';
import { FormatMessagePipe } from '../pipes/format-message.pipe';

@NgModule({
  declarations: [
    ModelSelectorComponent,
    AiChatbotComponent,
    FormatMessagePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ModelSelectorComponent,
    AiChatbotComponent,
    FormatMessagePipe
  ]
})
export class SharedModule { }
