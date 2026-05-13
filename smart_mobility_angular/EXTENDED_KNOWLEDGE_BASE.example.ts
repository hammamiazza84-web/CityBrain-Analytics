// 🤖 Exemples de réponses personnalisées pour l'Assistant IA
// Copie cette section dans ai-assistant.service.ts pour ajouter plus de réponses

export const EXTENDED_KNOWLEDGE_BASE = {
  // ─── QUESTIONS TECHNIQUES ───
  'api|backend|serveur|port': `🔧 **Architecture Backend:**
Notre backend utilise **Flask** sur Python.
• 🌐 URL: http://localhost:5000
• 📡 Type: REST API
• 📊 Endpoints: /stress, /transport, /infra, /env, /piml
• 🔐 Auth: JWT Tokens

Pour les détails techniques, contacte l'équipe dev! 👨‍💻`,

  'angular|frontend|framework|technologie': `⚛️ **Frontend - Angular 17**
Notre interface utilise les technologies modernes:
• 📦 **Framework**: Angular 17
• 🎨 **Styling**: SCSS
• 🔄 **State Management**: RxJS BehaviorSubject
• 🧪 **Tests**: Karma + Jasmine
• 📱 **Responsive**: Mobile-first

Architecture modulaire avec lazy-loading! 🚀`,

  'database|données|stockage|base': `🗄️ **Gestion des Données:**
• 📊 **MLflow**: Artifacts & Model Registry
• 📈 **Power BI**: Analytics & Reporting
• 🔐 **Sécurité**: Chiffrement des données
• 🌍 **Backup**: Cloud backup automatique
• 📋 **RGPD**: Conformité totale

Tes données sont sécurisées! 🛡️`,

  // ─── QUESTIONS MÉTIER ───
  'utilisateurs|roles|permissions|accès': `👥 **Gestion des Utilisateurs:**
Nous avons **4 rôles** différents:

1️⃣ **Smart Mobility Manager** - Accès complet
2️⃣ **Urban Planning Director** - Infrastructure + Rapports
3️⃣ **Environmental Analyst** - Environnement + Anomalies
4️⃣ **Client** - Vue d'ensemble simplifiée

Chaque rôle a des permissions spécifiques! 🔐`,

  'intégration|api externe|connexion': `🔗 **Intégrations Disponibles:**
• 📊 **Power BI**: Rapports décisionnels
• 📈 **MLflow**: Suivi des modèles
• 🌡️ **Weather API**: Données météo
• 📡 **REST API**: Intégrations custom

Prêt à se connecter à d'autres systèmes! 🌉`,

  // ─── QUESTIONS PRÉVALUATION ───
  'prix|coût|tarif|grille|payment': `💳 **Tarification:**
Nous proposons différents plans:
• 🆓 **Free**: Pour les projets pilots
• 💼 **Pro**: Équipes de 5-50 personnes
• 🏢 **Enterprise**: Solutions custom

Pour devis personnalisé: contact@smartmobility.fr 📧`,

  'démo|trial|essai|gratuit': `🎯 **Demander une Démo:**
• 📅 Réserve une démo en 30 minutes
• 👥 Équipe dédiée
• 💻 Accès sandbox complet
• 📊 Données d'exemple

Clique ici: [Réserver une démo](https://smartmobility.fr/demo) 🎬`,

  'intégration client|onboarding|mise en place': `🚀 **Onboarding & Intégration:**
1️⃣ Création du compte
2️⃣ Configuration initiale (15 min)
3️⃣ Import des données (1-2 jours)
4️⃣ Test des modèles
5️⃣ Formation équipe (2h)
6️⃣ Go live!

Support complet pendant toute l'intégration! 🤝`,

  // ─── QUESTIONS LÉGALES/COMPLIANCE ───
  'gdpr|rgpd|privé|données personnelles': `⚖️ **Conformité RGPD:**
✅ **100% Conforme**
• 🔐 Chiffrement end-to-end
• 🗑️ Droit à l'oubli
• 📋 Consentement utilisateur
• 📊 Audit trails complets
• 🛡️ Certification ISO27001

Tes données sont protégées légalement! ✅`,

  'sécurité|sso|authentification|2fa': `🔐 **Sécurité:**
• 🔑 **SSO/OAuth2**: Authentification sécurisée
• 📲 **2FA**: Optionnel
• 🛡️ **Firewall**: Protection DDoS
• 🔍 **Scanning**: Suivi des menaces
• 📝 **Logs**: Audit trail complet

Sécurité de niveau entreprise! 🏆`,

  // ─── QUESTIONS SUR LES PERFORMANCES ───
  'vitesse|performance|latence|temps': `⚡ **Performances:**
• ⚡ **API**: Réponse < 500ms
• 📊 **Dashboard**: Chargement < 2s
• 🧠 **Prédictions**: < 1 seconde
• 🌐 **Uptime**: 99.9%
• 📈 **Scalabilité**: Auto-scaling

Optimisé pour la vitesse! 🚀`,

  'maintenance|downtime|mise à jour': `🔧 **Maintenance & Mises à jour:**
• 📅 Fenêtres: Dimanche 2-4h (UTC)
• 📧 Notification: 7 jours avant
• ⚡ Zéro downtime updates
• 🆙 1-2 mises à jour/mois

Impact minimal sur ton activité! ✨`,

  // ─── ROADMAP & FEATURES ───
  'prochaines fonctionnalités|v2|évolutions|nouveau': `🗓️ **Roadmap 2026:**
**Q2 2026:**
✅ App mobile iOS/Android
✅ Export PDF des rapports
✅ Notification temps réel

**Q3 2026:**
🎯 IA Générative (ChatGPT integration)
🎯 Prédictions 12 mois
🎯 Collaboration équipe

**Q4 2026:**
🚀 Multi-régions
🚀 Blockchain audit trail
🚀 GraphQL API

On innove chaque jour! 🚀`,

  'mobile|app|iphone|android': `📱 **Application Mobile:**
En développement pour:
• 📲 **iOS**: Q2 2026
• 🤖 **Android**: Q2 2026

Fonctionnalités:
• 📊 Dashboard complet
• 🔔 Notifications temps réel
• 📝 Formulaires offline
• 🎨 Interface responsive

Bientôt disponible! 🚀`,

  // ─── SUPPORT & HELP ───
  'hotline|urgence|emergency|SLA': `🆘 **Support & SLA:**
• 🟢 **Green** (Non-urgent): 24h réponse
• 🟡 **Amber** (Important): 4h réponse
• 🔴 **Red** (Critique): 1h réponse

Contact 24/7:
• 📧 support@smartmobility.fr
• 📞 +33 1 XX XX XX XX
• 💬 Chat en direct (8-20h)

On est là pour toi! 🤝`,

  'formation|training|tutorial|apprendre': `📚 **Formation & Resources:**
• 📖 **Documentation**: docs.smartmobility.fr
• 🎓 **Webinaires**: Jeudi 14h
• 🎬 **Vidéos**: YouTube channel
• 📝 **Blog**: Astuces & bonnes pratiques
• 👨‍🏫 **Coaching**: Sessions 1-on-1

Apprendre à ton rythme! 📚`,

  'certificat|certification|badge': `🏆 **Certifications:**
• 🥇 **Certificat Utilisateur**: Gratuit
• 🥈 **Certificat Pro**: 2 jours
• 🥉 **Certificat Expert**: 5 jours

Valide ta maîtrise! 🎖️`,

  'partenaire|intégrateur|reseller': `🤝 **Programme Partenaires:**
Nous cherchons des:
• 🔧 Intégrateurs techniques
• 📢 Revendeurs
• 🎓 Formateurs certifiés
• 🤖 Développeurs extensions

Intéresse toi? [Rejoins l'écosystème](https://partners.smartmobility.fr) 🌟`,

  'success story|case study|client': `⭐ **Nos Succès:**
• 🏙️ **Paris**: -25% congestion (6 mois)
• 🚌 **Lyon**: +40% ponctualité
• 🌍 **Marseille**: -15% CO2

Tes résultats possibles! 📈`,

  // ─── MISC ───
  'suggestion|idée|feedback|amélioration': `💡 **Nous Écoutons Ton Feedback!**
Partage tes idées:
• 📧 ideas@smartmobility.fr
• 🗳️ Communauté: community.smartmobility.fr
• 🐞 Bugs: bugs@smartmobility.fr

Chaque feedback compte! 🙌`,

  'blague|joke|fun': `😄 **Easter Egg!**
Pourquoi les villes deviennent intelligentes?
Parce qu'elles utilisent Smart Mobility! 🧠🚀

Besoin d'autre chose? 😊`,

  'quitter|au revoir|bye': `👋 **À bientôt!**
Merci d'avoir utilisé Smart Mobility! 🚀
Reviens vite si tu as besoin! 💙`,

  // ─── DÉVELOPPEURS ───
  'api documentation|swagger|postman': `📚 **API Documentation:**
• 📖 Swagger UI: http://api.smartmobility.fr/docs
• 📄 OpenAPI Spec: /swagger.json
• 📮 Postman Collection: [Download](https://postman.smartmobility.fr)
• 🧪 Examples: GitHub repo

Ready to code! 💻`,

  'sdk|libraries|npm|python': `📦 **SDKs & Libraries:**
• 📦 **npm**: @smartmobility/js-sdk
• 🐍 **pip**: smartmobility-python
• 🎯 **Java**: com.smartmobility:sdk
• ⚙️ **Go**: github.com/smartmobility/go-sdk

Facile à intégrer! 🔌`,

  'github|sourcecode|repository|open source': `🔓 **Open Source:**
Retrouve notre code:
• 🔗 [GitHub](https://github.com/smartmobility)
• 📄 License: MIT & Apache 2.0
• 🤝 Contributions bienvenues!
• 🐛 Issues & PRs: discussions.github.com

Joins la communauté! 👨‍💻`,

  'webhook|event|callback|stream': `🪝 **Webhooks & Events:**
• 🔔 Real-time events
• 📡 WebSocket support
• 🔄 Auto-retry logic
• 🔐 Signed payloads

Reçois tes événements! 📨`,
};

// 📌 Instructions d'utilisation:
// 1. Copie les entrées du EXTENDED_KNOWLEDGE_BASE
// 2. Colle-les dans la knowledgeBase du ai-assistant.service.ts
// 3. Recharge le navigateur
// 4. Les nouvelles réponses sont disponibles!

// 🎨 Tips pour améliorer les réponses:
// 1. Ajoute des emojis pour la lisibilité
// 2. Utilise **gras** pour mettre en avant
// 3. Utilise des listes (• ou 1️⃣)
// 4. Sois concis mais complet
// 5. Ajoute des liens si pertinent
// 6. Personnalise selon ton contexte
