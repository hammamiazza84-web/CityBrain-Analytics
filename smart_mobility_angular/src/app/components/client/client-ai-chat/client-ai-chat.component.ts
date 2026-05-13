import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AiAssistantEnhancedService, Message } from '../../../services/ai-assistant-enhanced.service';

@Component({
  selector: 'app-client-ai-chat',
  template: `
    <div class="client-chat-container" [class.open]="isOpen">
      <!-- Chat Header -->
      <div class="client-chat-header">
        <div class="client-chat-brand">
          <span class="client-chat-avatar">🤖</span>
          <div class="client-chat-info">
            <h3 class="client-chat-title">Smart Assistant</h3>
            <p class="client-chat-status">{{ isOpen ? 'En ligne' : 'Fermé' }}</p>
          </div>
        </div>
        <button class="client-chat-close" (click)="toggleChat()">✕</button>
      </div>

      <!-- Suggestions rapides -->
      <div class="client-chat-suggestions" *ngIf="messages$ | async as messages">
        <div *ngIf="messages.length === 1" class="client-suggestions-grid">
          <button *ngFor="let q of suggestedQuestions" 
                  class="client-suggestion-btn"
                  (click)="sendMessage(q)">
            {{ q }}
          </button>
        </div>
      </div>

      <!-- Messages -->
      <div class="client-chat-messages" #messagesContainer>
        <div *ngFor="let msg of messages$ | async" 
             class="client-message" 
             [class.user]="msg.role === 'user'"
             [class.assistant]="msg.role === 'assistant'">
          <div class="client-message-avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="client-message-body">
            <div class="client-message-text" [innerHTML]="msg.content | formatMessage"></div>
            <div class="client-message-meta">
              {{ msg.timestamp | date:'HH:mm' }}
              <span *ngIf="msg.confidence" class="client-confidence">
                ({{ (msg.confidence * 100).toFixed(0) }}% confiance)
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="client-chat-input-area">
        <form (ngSubmit)="sendMessage(inputMessage)" class="client-chat-form">
          <input 
            type="text" 
            class="client-chat-input" 
            [(ngModel)]="inputMessage"
            name="message"
            placeholder="Pose une question..." 
            (keyup.enter)="sendMessage(inputMessage)"
            autocomplete="off">
          <button type="submit" class="client-chat-send">
            ➤
          </button>
        </form>
      </div>
    </div>

    <!-- Floating Button -->
    <button class="client-chat-fab" *ngIf="!isOpen" (click)="toggleChat()">
      🤖<span class="client-chat-badge">💬</span>
    </button>
  `,
  styles: [`
    :host {
      --chat-bg: #ffffff;
      --chat-border: #e0e7ff;
      --chat-text: #0f1419;
      --chat-text2: #5a6376;
      --chat-primary: #0084d4;
      --chat-user-bg: #f0f7ff;
      --chat-assistant-bg: #f9fafb;
    }

    .client-chat-container {
      position: fixed;
      bottom: 80px;
      right: 20px;
      width: 360px;
      height: 500px;
      background: var(--chat-bg);
      border: 1px solid var(--chat-border);
      border-radius: 16px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 5px 40px rgba(0, 0, 0, 0.08);
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px);
      transition: all 0.3s ease;
      z-index: 999;
      overflow: hidden;
    }

    .client-chat-container.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .client-chat-header {
      padding: 1rem;
      background: linear-gradient(135deg, #f0f7ff 0%, #e0efff 100%);
      border-bottom: 1px solid var(--chat-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .client-chat-brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .client-chat-avatar {
      font-size: 1.5rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .client-chat-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .client-chat-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--chat-text);
    }

    .client-chat-status {
      margin: 0;
      font-size: 0.75rem;
      color: var(--chat-text2);
      display: flex;
      align-items: center;
      gap: 0.3rem;
    }

    .client-chat-status::before {
      content: '';
      width: 6px;
      height: 6px;
      background: #22c55e;
      border-radius: 50%;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .client-chat-close {
      background: none;
      border: none;
      color: var(--chat-text2);
      font-size: 1.2rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .client-chat-close:hover {
      background: rgba(0, 132, 212, 0.1);
      color: var(--chat-text);
    }

    .client-chat-suggestions {
      padding: 0.75rem;
      border-bottom: 1px solid var(--chat-border);
    }

    .client-suggestions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.5rem;
    }

    .client-suggestion-btn {
      padding: 0.5rem 0.75rem;
      background: var(--chat-user-bg);
      border: 1px solid var(--chat-border);
      border-radius: 8px;
      color: var(--chat-primary);
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;
    }

    .client-suggestion-btn:hover {
      background: var(--chat-primary);
      color: white;
      border-color: var(--chat-primary);
    }

    .client-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .client-chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    .client-chat-messages::-webkit-scrollbar-thumb {
      background: rgba(0, 132, 212, 0.2);
      border-radius: 3px;
    }

    .client-message {
      display: flex;
      gap: 0.75rem;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .client-message.user {
      flex-direction: row-reverse;
    }

    .client-message-avatar {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .client-message-body {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
      max-width: 85%;
    }

    .client-message-text {
      background: var(--chat-assistant-bg);
      padding: 0.75rem;
      border-radius: 12px;
      font-size: 0.9rem;
      line-height: 1.4;
      color: var(--chat-text);
      word-wrap: break-word;
    }

    .client-message.user .client-message-text {
      background: var(--chat-primary);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .client-message.assistant .client-message-text {
      border-bottom-left-radius: 4px;
    }

    .client-message-meta {
      font-size: 0.7rem;
      color: var(--chat-text2);
      padding: 0 0.75rem;
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .client-confidence {
      font-size: 0.65rem;
      opacity: 0.7;
    }

    .client-chat-input-area {
      padding: 0.75rem;
      background: var(--chat-bg);
      border-top: 1px solid var(--chat-border);
    }

    .client-chat-form {
      display: flex;
      gap: 0.5rem;
    }

    .client-chat-input {
      flex: 1;
      padding: 0.65rem 0.75rem;
      background: var(--chat-user-bg);
      border: 1px solid var(--chat-border);
      border-radius: 8px;
      color: var(--chat-text);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .client-chat-input:focus {
      border-color: var(--chat-primary);
      box-shadow: 0 0 0 2px rgba(0, 132, 212, 0.1);
    }

    .client-chat-send {
      padding: 0.65rem 0.85rem;
      background: var(--chat-primary);
      border: none;
      border-radius: 8px;
      color: white;
      cursor: pointer;
      font-size: 0.95rem;
      transition: all 0.2s ease;
    }

    .client-chat-send:hover {
      background: #0073c0;
      transform: scale(1.05);
    }

    .client-chat-fab {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--chat-primary), #00c2ff);
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 132, 212, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 998;
      animation: bounce 2s ease-in-out infinite;
    }

    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-6px); }
    }

    .client-chat-fab:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 132, 212, 0.5);
    }

    .client-chat-badge {
      position: absolute;
      top: -5px;
      right: -5px;
      font-size: 0.8rem;
      animation: ping 2s ease-in-out infinite;
    }

    @keyframes ping {
      0% { transform: scale(1); opacity: 1; }
      75% { transform: scale(1.2); opacity: 0; }
      100% { transform: scale(1); opacity: 0; }
    }

    /* Dark theme */
    :host-context(body.dark-theme) {
      --chat-bg: #1a1f35;
      --chat-border: #2d3748;
      --chat-text: #e8f0fe;
      --chat-text2: #a0aec0;
      --chat-user-bg: rgba(0, 132, 212, 0.2);
      --chat-assistant-bg: rgba(255, 255, 255, 0.05);
    }

    /* Mobile */
    @media (max-width: 640px) {
      .client-chat-container {
        width: 100%;
        height: 100%;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }

      .client-chat-fab {
        bottom: 30px;
        right: 30px;
      }
    }
  `]
})
export class ClientAiChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  inputMessage = '';
  messages$ = this.aiService.conversation$;
  suggestedQuestions = [
    'Quel est mon score CO2?',
    'Meilleur itinéraire?',
    'Défis du mois',
    'Comment gagner des points?'
  ];

  constructor(private aiService: AiAssistantEnhancedService) { }

  ngOnInit(): void {
    this.aiService.setUserRole('client');
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(message?: string): void {
    const msg = message || this.inputMessage;
    if (msg.trim()) {
      this.aiService.sendMessage(msg);
      this.inputMessage = '';
    }
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
