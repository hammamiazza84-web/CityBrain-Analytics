@echo off
REM 🚀 Script de configuration OpenAI rapide pour Windows

echo.
echo =========================================
echo 🤖 Configuration OpenAI pour Smart Assistant
echo =========================================
echo.

REM Vérifier si le fichier environment.ts existe
if not exist "src\environments\environment.ts" (
    echo ❌ Fichier non trouvé: src\environments\environment.ts
    pause
    exit /b 1
)

echo ✅ Fichier trouvé: src\environments\environment.ts
echo.

echo =========================================
echo 📝 INSTRUCTIONS RAPIDES:
echo =========================================
echo.
echo 1️⃣  Va sur: https://platform.openai.com/api/keys
echo 2️⃣  Crée une nouvelle clé API
echo 3️⃣  Copie la clé (ex: sk-proj-...)
echo.
echo 4️⃣  Ouvre: src\environments\environment.ts
echo 5️⃣  Change:
echo     apiKey: 'sk-proj-YOUR_KEY_HERE'  ^<-- Colle ta clé ici
echo     enabled: true                    ^<-- Change FALSE en TRUE
echo.
echo 6️⃣  Sauvegarde avec Ctrl+S
echo 7️⃣  Recharge le navigateur (F5)
echo 8️⃣  Va sur /client ^> Test le chat 🤖
echo.

echo =========================================
echo 💡 Configuration actuelle:
echo =========================================
echo.
echo Ouvre VS Code et cherche la section:
echo   openai: {
echo     apiKey: ''
echo     model: 'gpt-4-turbo'
echo     temperature: 0.7
echo     maxTokens: 500
echo     enabled: false
echo   }
echo.

echo ✅ Prêt à utiliser OpenAI!
echo 📖 Voir le guide complet: OPENAI_SETUP_GUIDE.md
echo.

pause
