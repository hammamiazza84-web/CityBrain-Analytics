#!/bin/bash
# 🚀 Script de configuration OpenAI rapide

echo "========================================="
echo "🤖 Configuration OpenAI pour Smart Assistant"
echo "========================================="
echo ""

# Étape 1: Vérifier si le fichier environment.ts existe
echo "✓ Vérification des fichiers..."
if [ -f "src/environments/environment.ts" ]; then
    echo "✅ File found: src/environments/environment.ts"
else
    echo "❌ File not found!"
    exit 1
fi

# Étape 2: Instructions
echo ""
echo "📝 INSTRUCTIONS RAPIDES:"
echo ""
echo "1️⃣  Va sur: https://platform.openai.com/api/keys"
echo "2️⃣  Crée une nouvelle clé API"
echo "3️⃣  Copie la clé (ex: sk-proj-...)"
echo ""
echo "4️⃣  Ouvre: src/environments/environment.ts"
echo "5️⃣  Change:"
echo "    apiKey: 'sk-proj-YOUR_KEY_HERE'  ← Colle ta clé ici"
echo "    enabled: true                    ← Change FALSE en TRUE"
echo ""
echo "6️⃣  Sauvegarde et recharge le navigateur"
echo "7️⃣  Va sur /client → Test le chat 🤖"
echo ""

echo "========================================="
echo "💡 Configuration actuellement:"
echo "========================================="
grep -A 7 "openai:" src/environments/environment.ts || echo "Configuration non trouvée"
echo ""

echo "✅ Prêt à utiliser OpenAI!"
echo "📖 Voir le guide complet: OPENAI_SETUP_GUIDE.md"
