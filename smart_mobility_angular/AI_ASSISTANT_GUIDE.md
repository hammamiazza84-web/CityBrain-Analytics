# 🤖 Assistant IA - Documentation

## 📋 Vue d'ensemble

L'**Assistant IA** est un chatbot conversationnel intégré dans **Smart Mobility** qui aide les utilisateurs en répondant à des questions sur le projet, ses fonctionnalités et comment l'utiliser.

**Localisation:** Bouton flottant en bas à droite de l'écran (🤖)

---

## 🎯 Fonctionnalités

✅ **Réponses intelligentes** sur Smart Mobility  
✅ **Support multilingue** (français)  
✅ **Historique de conversation** avec timestamps  
✅ **Interface fluide** en mode clair/sombre  
✅ **Responsive** sur mobile et desktop  
✅ **Système de catégories** pour questions précises  

---

## 📁 Fichiers créés

```
src/app/
├── services/
│   └── ai-assistant.service.ts          # Core service du chatbot
├── components/ai/
│   └── ai-chatbot/
│       └── ai-chatbot.component.ts      # Interface du chatbot
├── pipes/
│   └── format-message.pipe.ts           # Formatage des messages
└── shared/
    └── shared.module.ts                 # Export du chatbot
```

---

## 🚀 Comment utiliser

### 1. **Ouvrir le chatbot**
- Clique sur le bouton 🤖 en bas à droite
- La fenêtre de chat s'ouvre

### 2. **Poser une question**
- Tape ta question dans le champ "Pose une question..."
- Appuie sur `Enter` ou clique sur ➤
- L'assistant répond automatiquement

### 3. **Gérer la conversation**
- 🔄 Bouton en bas = Nouvelle conversation (efface l'historique)
- ✕ Bouton en haut = Fermer le chat

---

## 📝 Comment ajouter des questions/réponses

Ouvre le fichier `src/app/services/ai-assistant.service.ts`

### Localise la section `knowledgeBase`:

```typescript
private knowledgeBase: KnowledgeBase = {
  'keyword1|keyword2|keyword3': `📌 **Titre de la réponse**
Contenu de la réponse
• Point 1
• Point 2
• Point 3`,

  'autres keywords': `Autre réponse...`,
};
```

### Exemple - Ajouter une nouvelle question:

```typescript
// AVANT (existant)
'team|équipe|qui': `👥 **Notre équipe:**...`,

// APRÈS (nouveau)
'team|équipe|qui': `👥 **Notre équipe:**...`,

'budget|investissement|coût': `💰 **Budget & Investissement:**
Smart Mobility est financé par les collectivités locales.
• 🏛️ Gouvernement local
• 🏢 Partenaires privés
• 🌍 Subventions EU
Pour plus de détails, contactez notre équipe.`,
```

---

## 🎨 Formatage des réponses

Le système supporte le formatage markdown simple:

| Syntax | Résultat | Exemple |
|--------|----------|---------|
| `**texte**` | Texte gras/coloré | `**Important**` → Important (bleu) |
| `\n` | Nouvelle ligne | `Ligne 1\nLigne 2` |
| `• texte` | Puce de liste | `• Item 1` |
| `1️⃣ texte` | Liste numérotée | `1️⃣ Item 1` |
| `emoji texte` | Avec emoji | `🚀 Texte` |

### Exemple complet:

```typescript
'question|keywords': `🎯 **Titre Principal**
Texte d'introduction

**Section gras:**
Contenu de section
• Point principal 1
• Point principal 2
  - Sous-point
  - Sous-point

📊 **Autre section:**
1️⃣ Étape 1
2️⃣ Étape 2
3️⃣ Étape 3

Pour plus d'infos: contacte l'équipe! 📧`,
```

---

## 🔧 Système de reconnaissance

Le chatbot utilise un **système de matching par keywords**:

1. L'utilisateur tape une question
2. Le system cherche les keywords dans `knowledgeBase`
3. Si match trouvé → répond avec la réponse
4. Sinon → répond par défaut (`'default'` key)

### Points clés:

✅ **Case-insensitive**: "BONJOUR" = "bonjour" ✓  
✅ **Correspondance partielle**: "smart mob" trouve "smart mobility" ✓  
✅ **Multiple keywords**: `'keyword1|keyword2|keyword3'` ✓  
✅ **Ordre d'essai**: Vérifie dans l'ordre des clés ✓  

### Meilleurs pratiques pour les keywords:

```typescript
// ✅ BON - Variantes communes
'stress|indicateur|pression|charge': `...`,

// ✅ BON - Synonymes
'transport|retard|ponctualité|flux': `...`,

// ❌ MAUVAIS - Trop court
'a': `...`,  // Correspond à trop de questions!

// ❌ MAUVAIS - Pas de variantes
'Question exacte uniquement': `...`,
```

---

## 🧪 Test et débogage

### 1. Voir les réponses en console:

Ajoute un log dans `ai-assistant.service.ts`:

```typescript
private generateResponse(userMessage: string): string {
  const lowerMessage = userMessage.toLowerCase();
  console.log('🤖 User message:', lowerMessage);
  
  for (const [keywords, response] of Object.entries(this.knowledgeBase)) {
    const keywordArray = keywords.split('|');
    if (keywordArray.some(keyword => lowerMessage.includes(keyword))) {
      console.log('✅ Matched keywords:', keywords);
      return response;
    }
  }
  
  console.log('❌ No match - returning default');
  return this.knowledgeBase['default'];
}
```

### 2. Tester une nouvelle réponse:

1. Modifie `knowledgeBase`
2. Recharge le navigateur
3. Pose la question dans le chat
4. Vérifie dans la console que les keywords matchent

---

## 🎨 Personnalisation du style

### Modifier les couleurs:

Dans `ai-chatbot.component.ts`, change les CSS variables:

```typescript
:host {
  --chat-primary: #0084d4;        // Couleur principale
  --chat-bg: #1a1f35;             // Fond du chat
  --chat-border: #2d3748;         // Bordures
  --chat-text: #e8f0fe;           // Texte principal
  --chat-text2: #a0aec0;          // Texte secondaire
  --chat-user-bg: rgba(0, 132, 212, 0.2);     // Fond messages user
  --chat-assistant-bg: rgba(255, 255, 255, 0.05);  // Fond messages IA
}
```

### Light theme:

Le composant support automatiquement le light/dark mode via:

```css
:host-context(body.light-theme) {
  --chat-bg: #ffffff;
  --chat-text: #0f1419;
  /* ... autres variables adaptées ... */
}
```

---

## 🚀 Idées futures

- [ ] Intégration avec API backend pour réponses dynamiques
- [ ] Analytics - Track questions posées
- [ ] Feedback utilisateur - Voter "utile"/"non utile"
- [ ] Suggestion automatique de questions populaires
- [ ] Multi-langue (EN, DE, IT, ES)
- [ ] Recherche dans la base de connaissances
- [ ] Export conversation en PDF
- [ ] Intégration avec ChatGPT API pour réponses illimitées

---

## 📞 Support

**Questions ou bugs?**

1. Vérifie la console du navigateur (F12)
2. Vérifie que `AiChatbotComponent` est importé dans `SharedModule`
3. Teste avec les keywords existants
4. Contact l'équipe dev 🚀

---

## 📚 Ressources

- [Angular Documentation](https://angular.io)
- [RxJS BehaviorSubject](https://rxjs.dev/api/index/class/BehaviorSubject)
- [Angular Pipes](https://angular.io/guide/pipes)
- [DomSanitizer](https://angular.io/api/platform-browser/DomSanitizer)

---

**Créé:** Mai 2026  
**Maintenu par:** Smart Mobility Team  
**Status:** ✅ Actif et fonctionnel
