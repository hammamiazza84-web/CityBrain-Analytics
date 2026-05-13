# Guide d'Intégration Power BI

## ✅ Composant Créé

Le composant `PowerbiDashboardComponent` est maintenant disponible à l'URL :
```
/powerbi/dashboard
```

## 📋 Étapes pour Intégrer Votre Dashboard

### 1. Publier sur Power BI Service

1. Ouvrez **Power BI Desktop**
2. Chargez votre fichier : `Dashboard Infrastructure final.pbix`
3. Cliquez sur **Publier** (ribbon Accueil)
4. Connectez-vous à votre compte Power BI (Microsoft)
5. Sélectionnez un espace de travail (Workspace)
6. Attendez la publication

### 2. Obtenir l'URL d'Intégration

**Option A - Iframe (Simple) :**
1. Allez sur [https://app.powerbi.com](https://app.powerbi.com)
2. Ouvrez votre rapport publié
3. Cliquez sur **Fichier** > **Intégrer dans un rapport** > **Publier sur le web**
4. Copiez l'URL fournie

**Option B - Embed URL (Sécurisé) :**
1. Dans Power BI Service, cliquez sur les **...** (plus d'options)
2. Sélectionnez **Intégrer** > **Intégrer dans un rapport**
3. Choisissez la taille d'intégration
4. Copiez l'**Embed URL** ou le code HTML

### 3. Configurer dans l'Application

1. Connectez-vous à l'application Angular (Manager)
2. Allez dans le menu **Business Intelligence** > **Dashboard Power BI**
3. Saisissez l'URL d'intégration
4. Cliquez sur **Enregistrer**

## 🔧 Intégration Technique

Le composant utilise deux méthodes :

### Méthode 1 : Iframe (Recommandée)
```html
<iframe src="URL_POWER_BI" frameborder="0" allowFullScreen="true"></iframe>
```

Avantages :
- ✅ Simple à configurer
- ✅ Fonctionne immédiatement
- ✅ Responsive

### Méthode 2 : Power BI JavaScript API (Avancée)

Pour une intégration plus avancée avec :
- Filtres interactifs
- Événements de clic
- Authentification sécurisée

Nécessite :
- Power BI Pro ou Premium
- Configuration de l'API dans Azure AD

## 📊 Fonctionnalités du Composant

| Fonctionnalité | Description |
|----------------|-------------|
| 🔧 Configuration | Interface pour saisir l'URL d'intégration |
| 🔄 Rafraîchir | Bouton pour recharger le dashboard |
| ⚙️ Modifier | Changer l'URL de configuration |
| 💾 Persistance | Sauvegarde dans localStorage |
| 📱 Responsive | S'adapte à tous les écrans |

## 🔒 Sécurité

**Important :** 
- L'URL d'intégration publique est visible par tous
- Pour données sensibles, utilisez **Power BI Embedded** avec authentification
- Nécessite Power BI Pro/Premium pour les rapports privés

## 🚀 Prochaines Étapes

1. **Publiez** votre fichier .pbix sur Power BI Service
2. **Obtenez** l'URL d'intégration
3. **Configurez** dans l'application Angular
4. **Testez** l'affichage interactif

## 📞 Support

En cas de problème :
1. Vérifiez que le rapport est publié
2. Confirmez l'URL d'intégration
3. Testez l'URL directement dans un navigateur
4. Vérifiez les permissions de partage

---

**Prêt ?** Publiez votre dashboard et intégrez-le ! 🎯
