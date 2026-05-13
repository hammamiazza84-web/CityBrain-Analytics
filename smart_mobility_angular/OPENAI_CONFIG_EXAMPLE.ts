// 📋 EXEMPLE DE CONFIGURATION - À Copier dans environment.ts

// ============================================
// ❌ AVANT (Sans OpenAI)
// ============================================
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001/api',
  weatherApiUrl: 'http://localhost:5002/api',
  mlflowDefaultUrl: 'http://localhost:5003',
  
  openai: {
    apiKey: '',              // ❌ Vide
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 500,
    enabled: false           // ❌ Désactivé
  }
};

// ============================================
// ✅ APRÈS (Avec OpenAI)
// ============================================
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5001/api',
  weatherApiUrl: 'http://localhost:5002/api',
  mlflowDefaultUrl: 'http://localhost:5003',
  
  openai: {
    apiKey: 'sk-proj-ABCDEfghijklmnopqrstuvwxyz123456789',  // ✅ Ta clé API
    model: 'gpt-4-turbo',   // GPT-4 Turbo = meilleur rapport qualité/prix
    temperature: 0.7,        // 0-1: Créativité (0.7 = équilibré)
    maxTokens: 500,          // Longueur max de la réponse
    enabled: true            // ✅ ACTIVÉ!
  }
};

// ============================================
// 🎯 MODÈLES DISPONIBLES
// ============================================

// Option 1: GPT-4 Turbo (RECOMMANDÉ) 👑
// - Rapidité: ⚡⚡⚡ (très rapide)
// - Qualité: 🏆🏆🏆 (excellente)
// - Prix: 💰 ($0.01/1K tokens)
model: 'gpt-4-turbo'

// Option 2: GPT-4 (Expert)
// - Rapidité: ⚡ (lent)
// - Qualité: 🏆🏆🏆🏆 (meilleure)
// - Prix: 💰💰 ($0.03/1K tokens)
model: 'gpt-4'

// Option 3: GPT-3.5 Turbo (Économique)
// - Rapidité: ⚡⚡⚡⚡ (très rapide)
// - Qualité: 🏆 (correcte)
// - Prix: 💰 ($0.0005/1K tokens)
model: 'gpt-3.5-turbo'

// ============================================
// 🎛️ PARAMÈTRES EXPLIQUÉS
// ============================================

// Temperature (Créativité)
// 0.0  = Réponses toujours identiques (déterministe)
// 0.3  = Conservateur, peu créatif
// 0.7  = 👈 RECOMMANDÉ (équilibré)
// 1.0  = Très créatif, aléatoire
temperature: 0.7

// Max Tokens (Longueur)
// 100   = Très court (1-2 lignes)
// 300   = Court (2-4 lignes)
// 500   = 👈 NORMAL (moyen, bon détail)
// 1000  = Long (très détaillé)
// 4096  = Maximum (document complet)
maxTokens: 500

// ============================================
// 💰 COÛTS ESTIMÉS
// ============================================

/*
Avec GPT-4 Turbo:
  1 conversation simple = 50 tokens = $0.0005
  100 conversations = $0.05
  1000 conversations = $0.50
  10000 conversations = $5.00

Exemple d'utilisation:
  - 1000 utilisateurs
  - 2 chats/jour chacun
  - = 2000 conversations/jour
  - = $1/jour = $30/mois

Gratuit:
  - $5 credit gratuit au signup
  - Suffit pour ~10000 conversations
*/

// ============================================
// 🔐 SÉCURITÉ - NE PAS EXPOSER
// ============================================

// ❌ MAUVAIS - Ne JAMAIS faire ça!
export const environment = {
  openai: {
    apiKey: 'sk-proj-...'  // ❌ VISIBLE SUR GITHUB!
  }
};

// ✅ BON - Utiliser des variables d'environnement
export const environment = {
  openai: {
    apiKey: process.env['OPENAI_API_KEY'] || ''
  }
};

// ✅ BON - Proxy Backend (plus sûr)
// Garde la clé côté serveur, frontend appelle /api/openai/chat

// ============================================
// 📖 DOCUMENTATION COMPLÈTE
// ============================================

/*
Pour plus de détails, consulte:
- OPENAI_SETUP_GUIDE.md  = Guide complet (10 pages)
- OPENAI_QUICK_START.sh  = Script rapide (Linux/Mac)
- OPENAI_QUICK_START.bat = Script rapide (Windows)

Ou via les services:
- api.openai.com/docs = Docs officielles
- community.openai.com = Forum communautaire
*/
