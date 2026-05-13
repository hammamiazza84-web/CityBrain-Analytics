import { Component, OnInit, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { AiAssistantEnhancedService, Message } from '../../../services/ai-assistant-enhanced.service';

@Component({
  selector: 'app-ai-chatbot',
  template: `
    <div class="chatbot-container" [class.open]="isOpen">
      <!-- Chat Header -->
      <div class="chat-header">
        <div class="chat-header-content">
          <span class="chat-icon">🤖</span>
          <div class="chat-title-block">
            <h3 class="chat-title">Assistant IA</h3>
            <p class="chat-subtitle">Smart Mobility Guide</p>
          </div>
        </div>
        <button class="chat-close-btn" (click)="toggleChat()" title="Fermer">
          ✕
        </button>
      </div>

      <!-- Chat Messages -->
      <div class="chat-messages" #messagesContainer>
        <div *ngFor="let msg of messages$ | async" 
             class="message" 
             [class.user]="msg.role === 'user'"
             [class.assistant]="msg.role === 'assistant'">
          <div class="message-avatar">
            {{ msg.role === 'user' ? '👤' : '🤖' }}
          </div>
          <div class="message-content">
            <div class="message-text" [innerHTML]="msg.content | formatMessage"></div>
            <div class="message-time">{{ msg.timestamp | date:'HH:mm' }}</div>
          </div>
        </div>
      </div>

      <!-- Chat Input -->
      <div class="chat-input-area">
        <form (ngSubmit)="sendMessage()" class="chat-form">
          <input 
            type="text" 
            class="chat-input" 
            [(ngModel)]="inputMessage"
            name="message"
            placeholder="Pose une question..." 
            (keyup.enter)="sendMessage()"
            autocomplete="off">
          <button type="submit" class="chat-send-btn" title="Envoyer">
            ➤
          </button>
        </form>
        <button class="chat-clear-btn" (click)="clearHistory()" title="Nouvelle conversation">
          🔄
        </button>
      </div>
    </div>

    <!-- Chat Toggle Button (Floating) -->
    <button class="chat-toggle-btn" *ngIf="!isOpen" (click)="toggleChat()" title="Ouvrir le chat">
      🤖
    </button>
  `,
  styles: [`
    :host {
      --chat-primary: #0084d4;
      --chat-bg: #1a1f35;
      --chat-border: #2d3748;
      --chat-text: #e8f0fe;
      --chat-text2: #a0aec0;
      --chat-user-bg: rgba(0, 132, 212, 0.2);
      --chat-assistant-bg: rgba(255, 255, 255, 0.05);
    }

    .chatbot-container {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 380px;
      height: 550px;
      background: var(--chat-bg);
      border: 1px solid var(--chat-border);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 5px 40px rgba(0, 0, 0, 0.3);
      opacity: 0;
      pointer-events: none;
      transform: translateY(20px);
      transition: all 0.3s ease;
      z-index: 999;
    }

    .chatbot-container.open {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }

    .chat-header {
      padding: 1rem;
      background: linear-gradient(135deg, rgba(0, 132, 212, 0.15), rgba(0, 194, 255, 0.1));
      border-bottom: 1px solid var(--chat-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 12px 12px 0 0;
    }

    .chat-header-content {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .chat-icon {
      font-size: 1.5rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }

    .chat-title-block {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .chat-title {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--chat-text);
    }

    .chat-subtitle {
      margin: 0;
      font-size: 0.75rem;
      color: var(--chat-text2);
    }

    .chat-close-btn {
      background: none;
      border: none;
      color: var(--chat-text2);
      cursor: pointer;
      font-size: 1.2rem;
      padding: 0;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: all 0.2s ease;
    }

    .chat-close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: var(--chat-text);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 3px;
    }

    .message {
      display: flex;
      gap: 0.75rem;
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message.user {
      flex-direction: row-reverse;
    }

    .message-avatar {
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    .message-content {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      flex: 1;
    }

    .message-text {
      background: var(--chat-assistant-bg);
      padding: 0.75rem;
      border-radius: 8px;
      font-size: 0.9rem;
      line-height: 1.4;
      color: var(--chat-text);
      word-wrap: break-word;
    }

    .message.user .message-text {
      background: var(--chat-user-bg);
      border: 1px solid rgba(0, 132, 212, 0.3);
    }

    .message-time {
      font-size: 0.7rem;
      color: var(--chat-text2);
      margin: 0 0.75rem;
    }

    .chat-input-area {
      padding: 1rem;
      background: rgba(0, 0, 0, 0.2);
      border-top: 1px solid var(--chat-border);
      border-radius: 0 0 12px 12px;
      display: flex;
      gap: 0.5rem;
    }

    .chat-form {
      flex: 1;
      display: flex;
      gap: 0.5rem;
    }

    .chat-input {
      flex: 1;
      padding: 0.6rem 0.75rem;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--chat-border);
      border-radius: 6px;
      color: var(--chat-text);
      font-size: 0.9rem;
      outline: none;
      transition: all 0.2s ease;
    }

    .chat-input:focus {
      border-color: var(--chat-primary);
      background: rgba(0, 132, 212, 0.1);
      box-shadow: 0 0 0 2px rgba(0, 132, 212, 0.1);
    }

    .chat-input::placeholder {
      color: var(--chat-text2);
    }

    .chat-send-btn,
    .chat-clear-btn {
      padding: 0.6rem 0.75rem;
      background: var(--chat-primary);
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .chat-send-btn:hover {
      background: #0073c0;
      transform: scale(1.05);
    }

    .chat-clear-btn {
      background: rgba(255, 255, 255, 0.1);
      color: var(--chat-text);
      padding: 0.6rem;
    }

    .chat-clear-btn:hover {
      background: rgba(255, 255, 255, 0.15);
    }

    .chat-toggle-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--chat-primary), #00c2ff);
      border: none;
      color: white;
      font-size: 1.8rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0, 132, 212, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      z-index: 998;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 4px 12px rgba(0, 132, 212, 0.4); }
      50% { box-shadow: 0 4px 20px rgba(0, 132, 212, 0.7); }
    }

    .chat-toggle-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 24px rgba(0, 132, 212, 0.6);
    }

    /* Light theme */
    :host-context(body.light-theme) {
      --chat-bg: #ffffff;
      --chat-border: #e0e7ff;
      --chat-text: #0f1419;
      --chat-text2: #5a6376;
      --chat-user-bg: rgba(0, 132, 212, 0.1);
      --chat-assistant-bg: #f3f4f6;
    }

    :host-context(body.light-theme) .chat-header {
      background: linear-gradient(135deg, rgba(0, 132, 212, 0.1), rgba(0, 194, 255, 0.08));
    }

    :host-context(body.light-theme) .chat-input {
      background: #f9fafb;
      border-color: #e0e7ff;
      color: #0f1419;
    }

    :host-context(body.light-theme) .chat-input:focus {
      background: #f3f4f6;
    }

    /* Mobile responsive */
    @media (max-width: 768px) {
      .chatbot-container {
        width: 100%;
        height: 100%;
        bottom: 0;
        right: 0;
        border-radius: 0;
      }

      .chat-header {
        border-radius: 0;
      }

      .chat-toggle-btn {
        bottom: 30px;
        right: 30px;
      }
    }
  `]
})
export class AiChatbotComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  isOpen = false;
  inputMessage = '';
  messages$ = this.aiService.conversation$;

  constructor(private aiService: AiAssistantEnhancedService) { }

  ngOnInit(): void {
    // Ouvrir le chat automatiquement au premier accès (optionnel)
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  sendMessage(): void {
    if (this.inputMessage.trim()) {
      this.aiService.sendMessage(this.inputMessage);
      this.inputMessage = '';
    }
  }

  clearHistory(): void {
    this.aiService.clearHistory();
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) { }
  }
}
