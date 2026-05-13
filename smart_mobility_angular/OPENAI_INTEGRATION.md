# 🔌 Intégration OpenAI - Guide Rapide

## ⚡ TL;DR (30 secondes)

```typescript
// 1. Obtenir clé API
// → https://platform.openai.com/api/keys → Create new secret key

// 2. Ajouter à environment.ts
openai: {
  apiKey: 'sk-proj-...TAD_CLÉ_ICI...',
  enabled: true
}

// 3. Tester
// → /client → 🤖 Chat → "Salut!"
// → Voir réponse OpenAI intelligente ✨
```

---

## 📚 Guide Complet

### Étape 1: Obtenir l'API Key

```bash
# 1. Créer compte OpenAI
https://platform.openai.com/signup

# 2. Aller aux API Keys
https://platform.openai.com/account/api-keys

# 3. Click "Create new secret key"
# Copier: sk-proj-...

# 4. Sauvegarder la clé en sécurité (une seule fois!)
```

### Étape 2: Configurer le Projet

**Fichier:** `src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001/api',
  
  // 🤖 OpenAI - Configuration
  openai: {
    apiKey: 'sk-proj-...YOUR_KEY...',    // ← Colle ta clé
    model: 'gpt-4-turbo',                 // Meilleur modèle
    temperature: 0.7,                     // 0-1 (créativité)
    maxTokens: 500,                       // Longueur réponse
    enabled: true                         // ← Important: Activé!
  }
};
```

### Étape 3: Comment ça marche

**Flux:**

```
User: "Quel est mon CO2?"
    ↓
Angular Chat Component
    ↓
AiAssistantEnhancedService
    ↓
[Check] Si openai.enabled = true
    ├─ YES → Appel OpenAI API
    │         + System Prompt (Smart Mobility context)
    │         + User Message
    │         → OpenAI répond intelligemment ✨
    │
    └─ NO → Utiliser Knowledge Base
             (réponses pré-écrites, plus lent)
    ↓
Réponse formatée avec emojis
    ↓
Affichée dans le chat
```

### Étape 4: Tester

```bash
# 1. Sauvegarder environment.ts (Ctrl+S)
# 2. Recharger navigateur (F5)
# 3. Naviguer vers /client
# 4. Cliquer 🤖 en bas à droite
# 5. Poser question: "Salut!"

# Résultat attendu:
# ✅ Réponse intelligente et personnalisée
# ✅ Avec emojis et contexte Smart Mobility
# ✅ Pas juste une réponse pré-écrite
```

---

## 🔍 Vérifier que ça marche

### Console Browser (F12)

```javascript
// Voir les logs OpenAI:
// 1. F12 → Console
// 2. Chercher "🚀 Appel OpenAI"
// 3. Voir la requête et réponse

// Ou ajouter du debug:
console.log('🚀 Question:', userMessage);
console.log('✅ Réponse OpenAI:', response);
```

### Network Tab (F12)

```
1. F12 → Network
2. Poser une question dans le chat
3. Voir requête HTTP POST
4. URL: https://api.openai.com/v1/chat/completions
5. Status: 200 OK = Succès ✅
```

---

## 💰 Monitorer les coûts

### Dashboard OpenAI

```
https://platform.openai.com/account/usage/overview

Voir:
- Utilisation en temps réel
- Coûts totaux
- Projections
```

### Exemples de coûts

| Cas | Conversations | Coût |
|-----|---|---|
| Test personnel | 100 | ~$0.05 |
| 10 utilisateurs | 1000 | ~$0.50 |
| 100 utilisateurs | 10000 | ~$5 |
| 1000 utilisateurs | 100000 | ~$50 |

### Budget Alert

```typescript
openai: {
  ...
  // Exemple: Limiter à $10/mois
  budgetLimit: 10
}
```

---

## 🎯 Utilisation Avancée

### 1. Contexte personnalisé

```typescript
// Dans ai-assistant-enhanced.service.ts
const systemPrompt = `
Tu es Smart Assistant.
Utilisateur: ${this.context.userRole}
Section: ${this.context.section}
Historique: ${this.context.historique.length} messages

Adapt ta réponse au contexte!
`;
```

### 2. Historique de conversation

```typescript
// OpenAI reçoit tout l'historique
messages: [
  { role: 'system', content: systemPrompt },
  { role: 'user', content: 'Message 1' },
  { role: 'assistant', content: 'Réponse 1' },
  { role: 'user', content: 'Message 2' },  // ← Contexte!
  { role: 'assistant', content: 'Réponse 2' }
]
```

### 3. Modération des réponses

```typescript
// Filtrer réponses non-appropriées
if (response.includes('inappropriate')) {
  return this.knowledgeBase['default'];
}
```

### 4. Fallback hybride

```typescript
// Utiliser OpenAI + Knowledge Base
try {
  response = await openai.generateResponse();
} catch {
  // Si OpenAI échoue, utiliser KB
  response = this.generateResponse(userMessage);
}
```

---

## ⚠️ Troubleshooting

### "Invalid API Key"

```typescript
// Solution: Vérifier la clé
1. Copier depuis https://platform.openai.com/api/keys
2. Vérifier qu'elle commence par "sk-"
3. Vérifier qu'elle est complète
4. Vérifier espace/caractères cachés
```

### "CORS Error"

```typescript
// Solution: Utiliser un proxy backend
// Backend:
@app.post('/api/openai')
def openai_proxy():
    return openai.ChatCompletion.create(...)

// Frontend:
this.http.post('/api/openai', { message })
```

### "Rate Limit"

```typescript
// Solution: Ajouter un délai
sendMessage(msg) {
  setTimeout(() => {
    this.aiService.sendMessage(msg);
  }, 1000); // 1 sec délai
}
```

### "No tokens left"

```typescript
// Solution: Configurer le billing
// https://platform.openai.com/account/billing/overview
```

---

## 📊 Comparaison: Knowledge Base vs OpenAI

| Aspect | KB | OpenAI |
|--------|----|----|
| **Coût** | Gratuit | $0.0005-0.03/réponse |
| **Qualité** | Bonne | Excellente |
| **Latence** | <100ms | ~500ms |
| **Personnalisation** | Fixe | Infinie |
| **Maintenance** | Manuel | Auto |
| **Contexte** | Non | Oui |
| **Scalabilité** | Bonne | Excellente |

---

## 🚀 Déploiement en Production

### 1. Sécuriser la clé

```bash
# Ne JAMAIS commiter la clé
echo "OPENAI_API_KEY=sk-..." > .env
echo ".env" >> .gitignore
```

### 2. Backend Proxy (Recommandé)

```python
# Flask Backend
import openai

@app.post('/api/openai/chat')
def chat():
    message = request.json['message']
    response = openai.ChatCompletion.create(
        model="gpt-4-turbo",
        messages=[{"role": "user", "content": message}]
    )
    return response.choices[0].message
```

```typescript
// Frontend (Angular)
this.http.post('/api/openai/chat', { message })
```

### 3. Variables d'environnement

```bash
# Heroku
heroku config:set OPENAI_API_KEY=sk-...

# AWS
aws ssm put-parameter --name OPENAI_API_KEY --value sk-...

# Docker
ENV OPENAI_API_KEY=sk-...
```

---

## 📖 Ressources

- **Docs:** https://platform.openai.com/docs
- **Pricing:** https://openai.com/pricing
- **Community:** https://community.openai.com
- **Discord:** https://discord.gg/openai

---

## ✅ Checklist Final

- [ ] Compte OpenAI créé
- [ ] API Key générée
- [ ] Key collée dans environment.ts
- [ ] `enabled: true`
- [ ] Navigateur rechargé
- [ ] Chat testé
- [ ] Réponse OpenAI vérifiée
- [ ] Coûts monitérés
- [ ] Key sécurisée (pas sur GitHub)
- [ ] Production déployée

---

**Status:** ✅ Prêt à utiliser!  
**Support:** Voir OPENAI_SETUP_GUIDE.md pour plus de détails
