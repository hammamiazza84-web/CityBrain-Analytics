import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, forkJoin } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';
import { environment } from '@env/environment';
import { ApplicationContextService } from './application-context.service';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  confidence?: number;
}

export interface ConversationContext {
  userRole: string;
  section?: string;
  historique: Message[];
}

interface KnowledgeBase {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiAssistantEnhancedService {
  private conversationHistory = new BehaviorSubject<Message[]>([]);
  public conversation$ = this.conversationHistory.asObservable();
  
  private context: ConversationContext = {
    userRole: 'user',
    historique: []
  };

  // API Groq via proxy backend FastAPI (port 5004)
  private openaiApiKey = environment.openai.apiKey;
  private useExternalAi = environment.openai.enabled;
  private openaiModel = environment.openai.model;
  private assistantProxyUrl = 'http://localhost:5004/api/assistant/chat'; // appel direct au backend

  private knowledgeBase: KnowledgeBase = {
    // ─── CLIENT FRIENDLY QUESTIONS ───
    'smart mobility|projet|qu\'est ce que|c\'est quoi': `🚦 **Smart Mobility** est ton assistant intelligent pour optimiser ta mobilité urbaine! 
Nous utilisons l'IA pour:
• 🚌 Améliorer la ponctualité des transports
• 🌿 Réduire l'empreinte carbone
• 📊 T'envoyer des alertes utiles
• 💡 Te donner des conseils personnalisés`,

    'stress|indicateur|pression|bien etre': `😌 **Indicateurs de Stress** - On analyse le stress urbain pour toi!
Nos capteurs détectent:
• 🚗 Congestion routière
• 🚌 Surcharge transports
• 🌡️ Température/Climat
• 📊 Activités suspectes

Reçois des alertes quand ça s'aggrave! 🚨`,

    'transport|retard|ponctualité|bus|metro': `🚌 **Transport en Commun** - Sois toujours à l'heure!
On te propose:
• ⏰ Horaires optimisés
• 🚨 Alertes retard temps réel
• 📱 Meilleur itinéraire
• 🌿 Options écologiques

Arrive frais et zen! 🧘`,

    'carbon|co2|empreinte|écologie|vert': `🌿 **Empreinte Carbone** - Deviens écolo!
Chaque trajet compte:
• 📊 Calcul automatique CO2
• 🏆 Défis verts hebdo
• 🌱 Points récompense
• 📈 Suivi progression

Aide la planète, gagne des points! 🌍`,

    'recommandation|conseil|quoi faire|aide': `💡 **Recommandations Personnalisées** - Juste pour toi!
Je te propose:
• 🚶 Meilleur transport selon météo
• 📱 Heure optimale pour partir
• 🌿 Option + écologique
• 💪 Défi bien-être du jour

Écoute mes conseils! 🎯`,

    'alerte|notification|danger|attention|problème': `🚨 **Alertes Smart** - Reste informé!
Tu reçois des alertes sur:
• 🚌 Retards transports
• 🚗 Embouteillages majeurs
• 🌡️ Météo extrême
• 📊 Anomalies détectées

Configure tes préférences! ⚙️`,

    'données|privée|sécurité|confiance': `🔒 **Ta Sécurité & Vie Privée** - Tu es protégé!
✅ Tes données:
• 🔐 Chiffrées end-to-end
• 👁️ Jamais vendues
• 📋 RGPD conforme
• 🛡️ Protégées 24/7

On te fait confiance, tu nous fais confiance! 💙`,

    'contact|aide|support|problème|bug': `📞 **Aide & Support** - Je suis là!
Contacte-nous:
• 💬 Chat direct (ici!)
• 📧 support@smartmobility.fr
• 📱 App mobile (bientôt)
• 🕐 Disponible 24/7

Besoin de quoi? 🤝`,

    'app|mobile|iphone|android|télécharger': `📱 **Application Mobile** - Partout avec toi!
Coming soon:
• 🍎 iOS Q2 2026
• 🤖 Android Q2 2026
• 📊 Dashboard complet
• 🔔 Notifications push
• 🗺️ Cartes interactives

Reste connecté! 📲`,

    'reward|point|gamification|défi|trophée': `🏆 **Système de Points** - Gagne en bougean!
Comment gagner:
• 🚶 +10 pts/km écolo
• 🌿 +50 pts/week green
• 🎯 +100 pts/défi complété
• 🌟 Trophées spéciaux

Échange tes points! 💰`,

    'météo|pluie|soleil|température|climat': `🌤️ **Météo Intégrée** - Pour tes trajets!
On te montre:
• ☀️ Meteo heure par heure
• 🌧️ Pluie prévue
• 🌡️ Température ressentie
• 💨 Vitesse du vent
• 🎒 Quoi emporter

Sois toujours prêt! ☔`,

    'itinéraire|route|chemin|aller|destination': `🗺️ **Meilleur Itinéraire** - Navigue smartement!
Calcul intelligent de:
• ⏱️ Temps estimé
• 🚗 Options transport
• 🌿 Émissions CO2
• 💰 Prix du trajet
• 🚨 Anomalies/Retards

Trouve ta route idéale! 🧭`,

    'prix|tarif|coût|gratuit|payer|billet': `💳 **Tarification** - Transparent et juste!
Notre modèle:
• 🆓 Version gratuite (pub)
• 💳 Premium +2€/mois (no pub)
• 👨‍👩‍👧 Familial -30% (5 pers)
• 🎓 Étudiant -50%

Choisir ton plan! 📊`,

    'historique|mes trajets|statistique|données|profil': `📊 **Mon Profil** - Ton tableau de bord!
Consulte:
• 📈 Trajets ce mois-ci
• 🌿 CO2 économisé
• ⏱️ Temps total
• 🏆 Points accumulés
• 🎯 Défis réalisés

Voir mes stats! 📉`,

    'défi|challenge|compétition|classement|amis': `🎯 **Défis & Compétition** - Joue et gagne!
Types de défis:
• 🌿 Week green: Trajets verts
• 🏃 Speed: + rapide
• 💡 Smart: Conseils suivis
• 👥 Classement ami
• 🌍 Objectif collectif

Relève le défi! 💪`,

    'article|blog|news|actualité|vidéo': `📰 **Ressources & Learning** - Reste à jour!
Découvre:
• 📝 Blog conseils mobilité
• 🎬 Tutos courtes vidéos
• 📚 Guides PDF
• 🎙️ Podcast mobilité
• 🌐 Webinaire mensuel

Apprend en t'amusant! 🎓`,

    'rejoindre|inscription|compte|nouveau': `✅ **Inscription Facile** - Commence maintenant!
3 étapes:
1️⃣ Crée ton compte (email)
2️⃣ Valide (lien mail)
3️⃣ Configure tes préfs

Prêt en 2 min! 🚀`,

    'quitter|supprimer|compte|données': `🗑️ **Supprimer Compte** - Pas de souci!
Tu peux:
• 🔄 Télécharger tes données
• 🗑️ Supprimer tout
• 📧 Export historique
• 📝 Recevoir certificat

Ton droit garanti! ✅`,

    // ─── CONTEXT-AWARE RESPONSES ───
    'merci|merci beaucoup|bien|c\'est cool|excellent': `😊 C'est un plaisir! Besoin d'autre chose? Utilise-moi sans hésiter! 💙`,

    'quitter|bye|adieu|au revoir|à bientôt': `👋 À bientôt et bon trajet! 🚀 Prends soin de toi! 🌟`,

    'blague|humour|funny|rigolo': `😄 Pourquoi les villes intelligentes adorent Smart Mobility? Parce qu'on rend leurs trajets **fluides** et **verts**! 🚀🌿`,

    'default': `Je n'ai pas bien compris! 🤔 Essaye:\n• "Quel est mon score CO2?"\n• "Comment ça marche?"\n• "Aide"\n\nOu pose simplement ta question! 💬`
  };

  constructor(private http: HttpClient, private contextService: ApplicationContextService) {
    this.addWelcomeMessage();
  }

  setUserRole(role: string): void {
    this.context.userRole = role;
  }

  setSection(section: string): void {
    this.context.section = section;
  }

  private addWelcomeMessage(): void {
    const welcome: Message = {
      id: this.generateId(),
      role: 'assistant',
      content: `👋 Salut! Je suis **Smart Assistant** - ton compagnon mobilité! 🚀\n\nJe peux t'aider avec:\n• 📊 Tes trajets et stats\n• 🌿 Ton impact carbone\n• 🚌 Transports en commun\n• 💡 Conseils personnalisés\n• 🎯 Défis et récompenses\n\nQuoi de neuf? 😊`,
      timestamp: new Date(),
      confidence: 1.0
    };
    this.conversationHistory.next([welcome]);
  }

  sendMessage(userMessage: string): void {
    if (!userMessage.trim()) return;

    const currentHistory = this.conversationHistory.value;
    const userMsg: Message = {
      id: this.generateId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      confidence: 1.0
    };

    currentHistory.push(userMsg);
    this.conversationHistory.next([...currentHistory]);
    this.context.historique.push(userMsg);

    // Simuler la réponse avec délai
    setTimeout(() => {
      const confidence = 0.9;

      if (this.useExternalAi) {
        this.generateSmartResponse(userMessage).subscribe(response => {
          if (response && response.trim()) {
            this.addAssistantMessage(response, confidence);
          } else {
            // Fallback knowledge base si réponse vide
            this.addAssistantMessage(this.generateResponse(userMessage), 0.6);
          }
        });
      } else {
        this.addAssistantMessage(this.generateResponse(userMessage), confidence);
      }
    }, 300);
  }

  private addAssistantMessage(content: string, confidence: number): void {
    const currentHistory = this.conversationHistory.value;
    const assistantMsg: Message = {
      id: this.generateId(),
      role: 'assistant',
      content: content,
      timestamp: new Date(),
      confidence: confidence
    };

    currentHistory.push(assistantMsg);
    this.conversationHistory.next([...currentHistory]);
    this.context.historique.push(assistantMsg);
  }

  private generateSmartResponse(userMessage: string): Observable<string> {
    // Récupérer météo + transport depuis le vrai backend (app.py)
    const weatherObs = this.http.get<any>(`${environment.weatherApiUrl}/weather/realtime?city=Paris`)
      .pipe(timeout(3000), catchError(() => of(null)));

    const transportObs = this.http.get<any>(`${environment.apiUrl}/transport/summary`)
      .pipe(timeout(3000), catchError(() => of(null)));

    const stressObs = this.http.get<any>(`${environment.apiUrl}/stress/summary`)
      .pipe(timeout(3000), catchError(() => of(null)));

    return forkJoin({ weather: weatherObs, transport: transportObs, stress: stressObs }).pipe(
      map(({ weather, transport, stress }) => {
        let liveContext = '📊 DONNÉES EN TEMPS RÉEL — Smart Mobility:\n\n';

        if (weather) {
          liveContext += `🌤️ Météo: ${weather.temperature}°C, ${weather.condition}\n`;
          liveContext += `   Humidité: ${weather.humidity}% | Vent: ${weather.wind}\n\n`;
        }

        if (transport) {
          liveContext += `🚌 Transport: Retard moyen ${transport.avg_delay || 0} min\n\n`;
        }

        if (stress) {
          liveContext += `😟 Stress urbain: ${stress.avg_stress || 'N/A'}/5\n\n`;
        }

        const recentMessages = this.context.historique.slice(-8).map(m => ({
          role: m.role,
          content: m.content
        }));

        return { liveContext, recentMessages };
      }),
      switchMap(({ liveContext, recentMessages }) => {
        const body = {
          message: userMessage,
          audience: this.context.userRole || 'client',
          messages: recentMessages,
          context: { summary: liveContext, section: this.context.section }
        };

        return this.http.post<any>(this.assistantProxyUrl, body).pipe(
          map(response => {
            if (response?.reply) {
              console.log('✅ Groq Response:', response.reply);
              return response.reply;
            }
            return '';
          }),
          catchError(error => {
            console.error('❌ Assistant Proxy Error:', error);
            return of('');
          })
        );
      })
    );
  }

  private generateResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Amélioration: chercher le meilleur match
    let bestMatch = { score: 0, response: this.knowledgeBase['default'] };

    for (const [keywords, response] of Object.entries(this.knowledgeBase)) {
      if (keywords === 'default') continue;

      const keywordArray = keywords.split('|');
      const matchScore = keywordArray.filter(keyword => 
        lowerMessage.includes(keyword)
      ).length;

      if (matchScore > bestMatch.score) {
        bestMatch = { score: matchScore, response };
      }
    }

    return bestMatch.response;
  }

  clearHistory(): void {
    this.addWelcomeMessage();
    this.context.historique = [];
  }

  // Méthode pour obtenir des réponses contextuelles
  getContextualResponse(topic: string): string {
    return this.generateResponse(topic);
  }

  // Méthode pour tracker les questions populaires
  getPopularQuestions(): string[] {
    return [
      'Quel est mon score CO2?',
      'Comment gagner des points?',
      'Meilleur itinéraire?',
      'Alertes transports',
      'Défis du mois'
    ];
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Configuration OpenAI (pour évolutions futures)
  configureExternalAi(apiKey: string, useIt: boolean = false): void {
    this.openaiApiKey = apiKey;
    this.useExternalAi = useIt;
  }
}
