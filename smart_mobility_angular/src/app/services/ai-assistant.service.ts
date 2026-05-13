import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface KnowledgeBase {
  [key: string]: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiAssistantService {
  private conversationHistory = new BehaviorSubject<Message[]>([]);
  public conversation$ = this.conversationHistory.asObservable();

  private knowledgeBase: KnowledgeBase = {
    // À propos du projet
    'smart mobility|projet|qu\'est ce que|c\'est quoi': `🚦 **Smart Mobility** est une plateforme intelligente de gestion urbaine qui utilise l'IA et le machine learning pour optimiser les transports en commun, l'énergie et les infrastructures. Notre objectif: rendre les villes plus fluides et durables! 🌍`,

    'objectif|mission|but': `🎯 **Notre mission:** Transformer les villes grâce à l'intelligence artificielle pour améliorer la qualité de vie des citoyens. On aide à:\n• 📊 Prédire et réduire les stress urbains\n• 🚌 Optimiser les transports\n• ⚡ Économiser l'énergie\n• 🌿 Réduire les émissions CO2\n• 🛡️ Détecter les anomalies et risques`,

    'fonctionnalités|faire': `✨ **Ce que tu peux faire ici:**\n• 📈 **Stress Prediction**: Analyser les indicateurs de stress urbain\n• 🚌 **Transport**: Optimiser la ponctualité et les flux\n• 🏗️ **Infrastructure**: Planifier la maintenance\n• 🌿 **Environnement**: Suivre l\'empreinte carbone\n• 🛡️ **Sécurité**: Audit et prévention des risques\n• 📊 **Rapports**: Consulter les dashboards Power BI`,

    'comment utiliser|guide|commencer': `🚀 **Bienvenue!** Voici comment commencer:\n1️⃣ **Explore les sections** dans le menu à gauche\n2️⃣ **Sélectionne un modèle** pour ta catégorie\n3️⃣ **Remplis le formulaire** avec tes données\n4️⃣ **Lance la prédiction** et voir les résultats\n5️⃣ **Consulte les recommandations** de l\'IA\n\nBesoin d\'aide? Je suis là! 😊`,

    'sections|menu|navigation': `🗺️ **Les sections principales:**\n• 📊 **Vue d\'ensemble**: Dashboard général\n• 🧠 **Stress**: Prédictions de stress urbain\n• 🚌 **Transport**: Retards et optimisation\n• 🏗️ **Infrastructure**: Maintenance et énergie\n• 🌿 **Environnement**: CO2 et durabilité\n• 🛡️ **Sécurité**: Audit et risques\n• 📈 **Rapports**: Power BI`,

    'modèles|meilleur modèle|sélection': `🧠 **Nos meilleurs modèles (1 par section):**\n• Stress: **XGBoost** (89% de précision)\n• Transport: **Anomaly Detection** (88%)\n• Infrastructure: **Classification** (91%)\n• PIML: **Classification** (86%)\n• Environnement: **CO2 Prediction** (90%)\n• Anomalies: **ISO + SVM** (92%)\n\nChaque section a été affinée avec le meilleur algorithme! ✅`,

    'team|équipe|qui': `👥 **Notre équipe:**\nCe projet est développé par une équipe passionnée d\'experts en:\n• 🤖 Machine Learning & IA\n• 📊 Data Science\n• 🔧 Ingénierie Logicielle\n• 🎨 UX/Design\n\nOn travaille ensemble pour rendre les villes plus intelligentes!`,

    'contact|aide|support': `📞 **Besoin d\'aide?**\n• 💬 Utilise ce chat pour tes questions\n• 📧 Contact l\'équipe via l\'email de support\n• 📚 Consulte la documentation\n• 🐛 Signale les bugs\n\nOn est là pour toi! 🤝`,

    'données|privacy|sécurité': `🔒 **Données & Sécurité:**\n• ✅ Tes données sont protégées\n• 🔐 Chiffrement end-to-end\n• 👤 Authentification sécurisée\n• 📋 Conformité aux réglementations\n\nTa confiance est notre priorité! 🛡️`,

    'performance|précision|résultats': `📊 **Notre performance:**\n• ✅ Précision moyenne: **89%**\n• ⚡ Vitesse de prédiction: < 1 seconde\n• 🎯 Taux de confiance: élevé\n• 📈 Améliorations continues\n\nOn teste constamment pour rester au top! 🚀`,

    'transport|retard|ponctualité': `🚌 **Transport & Ponctualité:**\nOn aide à:\n• 📊 Prédire les retards\n• 🔍 Analyser les perturbations\n• 📅 Planifier les ressources\n• 🚨 Alerter en temps réel\n\nObjectif: zéro retard! ⏰`,

    'énergie|infra|maintenance': `⚡ **Énergie & Infrastructure:**\nNos solutions:\n• 🔋 Optimiser la consommation\n• 🏗️ Prédire la maintenance\n• 💡 Réduire les coûts\n• 🌍 Être durable\n\nInfrastructures intelligentes! 🏢`,

    'environnement|co2|carbon': `🌿 **Environnement & CO2:**\nNous trackons:\n• 🌍 Empreinte carbone\n• 🚗 Émissions transport\n• 📊 Impact urbain\n• 📈 Tendances durabilité\n\nVers des villes zéro-carbone! ♻️`,

    'anomalies|alertes|risques': `🚨 **Détection d\'Anomalies:**\nOn détecte:\n• 🔴 Incidents critiques\n• ⚠️ Comportements anormaux\n• 📉 Baisse de performance\n• 🛡️ Risques potentiels\n\nVigi\n lance continue pour ta sécurité! 👁️`,

    'rapport|powerbi|dashboard': `📈 **Rapports & Dashboards:**\n• 📊 Visualisations Power BI\n• 📉 Tendances et analytics\n• 📋 Rapports détaillés\n• 📱 Accessible partout\n\nTes données à portée de main! 👀`,

    'améliorations|futures|roadmap': `🗓️ **Ce qui arrive:**\n• 🤖 Plus d\'intégration IA\n• 📱 Application mobile\n• 🌐 Expansion internationale\n• 🎨 Nouvelles visualisations\n• ⚡ Vitesse améliorée\n\nOn innove chaque jour! 🚀`,

    'merci|remerci|bien': `😊 De rien! Heureux de t\'aider. Besoin d\'autre chose? 🤝`,

    'hello|hi|bonjour|salut': `👋 Salut! Bienvenue sur **Smart Mobility**! Comment puis-je t\'aider aujourd\'hui? 🚀`,

    'default': `Je n\'ai pas compris ta question. 🤔 Essaye de me demander:\n• "À propos du projet"\n• "Comment utiliser"\n• "Quels modèles"\n• "Aide"\n\nOu pose simplement ta question! 💬`
  };

  constructor() {
    this.addWelcomeMessage();
  }

  private addWelcomeMessage(): void {
    const welcome: Message = {
      id: this.generateId(),
      role: 'assistant',
      content: `👋 Salut! Je suis l'**Assistant Smart Mobility**! Je suis ici pour répondre à tes questions sur le projet. Demande-moi n'importe quoi! 🚀\n\n💡 **Quelques suggestions:**\n• "À propos du projet"\n• "Comment ça marche?"\n• "Quels modèles utilisez-vous?"\n• "Comment commencer?"`,
      timestamp: new Date()
    };
    this.conversationHistory.next([welcome]);
  }

  sendMessage(userMessage: string): void {
    if (!userMessage.trim()) return;

    // Ajouter le message utilisateur
    const currentHistory = this.conversationHistory.value;
    const userMsg: Message = {
      id: this.generateId(),
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };

    currentHistory.push(userMsg);
    this.conversationHistory.next([...currentHistory]);

    // Générer la réponse
    setTimeout(() => {
      const assistantResponse = this.generateResponse(userMessage);
      const assistantMsg: Message = {
        id: this.generateId(),
        role: 'assistant',
        content: assistantResponse,
        timestamp: new Date()
      };

      currentHistory.push(assistantMsg);
      this.conversationHistory.next([...currentHistory]);
    }, 500); // Petit délai pour sembler plus naturel
  }

  private generateResponse(userMessage: string): string {
    const lowerMessage = userMessage.toLowerCase();

    // Chercher une correspondance dans la knowledge base
    for (const [keywords, response] of Object.entries(this.knowledgeBase)) {
      const keywordArray = keywords.split('|');
      if (keywordArray.some(keyword => lowerMessage.includes(keyword))) {
        return response;
      }
    }

    // Réponse par défaut
    return this.knowledgeBase['default'];
  }

  clearHistory(): void {
    this.addWelcomeMessage();
  }

  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
