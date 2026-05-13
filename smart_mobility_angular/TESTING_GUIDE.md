# Guide de Test du Système de Sélection des Modèles

## Accès au Dashboard

1. **Se connecter à l'application**
   - URL: `http://localhost:4200/login`
   - Utilisateur test: n'importe quel rôle (manager, urban, env, client)
   - Les identifiants de démarrage rapide sont disponibles

2. **Naviguer vers le Dashboard**
   - URL: `http://localhost:4200/dashboard`
   - Vous verrez la nouvelle interface de sélection des modèles

## Test des Fonctionnalités

### Test 1: Affichage des Modèles

**Attendu:**
- Affichage d'une grille de 6 cartes (une par section)
- Chaque carte affiche:
  - Icône de la section (🔮, 🚌, 🏗️, etc.)
  - Liste déroulante des modèles
  - Modèle pré-sélectionné (celui par défaut)
  - Informations du modèle (description, précision)

**Test:**
```
1. Ouvrir le dashboard
2. Vérifier que les 6 sections sont présentes:
   ✓ Stress Prediction 🔮
   ✓ Transport 🚌
   ✓ Infrastructure 🏗️
   ✓ PIML 📊
   ✓ Environment 🌿
   ✓ Anomaly Detection 🔴

3. Vérifier que chaque section affiche:
   ✓ Un sélecteur dropdown
   ✓ Le modèle par défaut sélectionné
   ✓ Les infos du modèle (nom, description, précision)
```

### Test 2: Sélection d'un Modèle

**Attendu:**
- Cliquer sur le dropdown d'une section affiche les modèles disponibles
- Sélectionner un modèle met à jour l'affichage
- Les infos du modèle s'actualisent

**Test:**
```
1. Dans la section "Transport", cliquer sur le dropdown
2. Vérifier que deux options apparaissent:
   ✓ Transport Prédiction Retard (82%)
   ✓ Transport Anomalie Detection (88%)

3. Sélectionner "Transport Anomalie Detection"
4. Vérifier que l'affichage se met à jour:
   ✓ Le dropdown affiche le nouveau modèle
   ✓ La description change
   ✓ La précision affichée: 88%

5. Compter les sections configurées:
   ✓ "X/6 sections configurées" s'update à la hausse
```

### Test 3: Persistance des Données

**Attendu:**
- Les sélections sont sauvegardées dans localStorage
- Rafraîchir la page conserve les sélections
- Fermer et rouvrir le navigateur conserve les sélections

**Test:**
```
1. Faire plusieurs sélections (ex: 3 modèles différents)
2. Ouvrir la console (F12)
3. Dans le terminal, taper: localStorage.getItem('selectedModels')
4. Vérifier que les sélections sont stockées:
   ✓ Format JSON avec les IDs des modèles
   ✓ Exemple: {"stress":"stress-xgboost","transport":"transport-anomaly",...}

5. Rafraîchir la page (F5)
6. Vérifier que les sélections sont restaurées

7. Fermer complètement l'onglet
8. Rouvrir http://localhost:4200/login
9. Naviguer au dashboard
10. Vérifier que les sélections sont toujours présentes
```

### Test 4: Compteur de Sections Configurées

**Attendu:**
- Affiche "X/6 sections configurées"
- Se met à jour quand on change un modèle
- Montre 0/6 si on remet tout par défaut

**Test:**
```
1. Compter combien de sections on a le choix
2. Vérifier le texte "X/6 sections configurées"
3. Changer un modèle
4. Vérifier que le compteur augmente (si ce modèle n'était pas déjà sélectionné)
5. Vérifier que chaque section a au moins 1 modèle sélectionné
   ✓ Compteur doit arriver à 6/6
```

### Test 5: Responsive Design

**Attendu:**
- Les cartes s'adaptent à la taille de l'écran
- Sur mobile: une colonne
- Sur tablet: 2-3 colonnes
- Sur desktop: 3-4 colonnes

**Test:**
```
1. Ouvrir le dashboard sur desktop (1920px+)
   ✓ Les cartes sont alignées sur 3-4 colonnes

2. Redimensionner à tablet (768px)
   ✓ Les cartes passent à 2 colonnes

3. Redimensionner à mobile (400px)
   ✓ Les cartes passent à 1 colonne

4. Vérifier que les sélecteurs restent fonctionnels
```

### Test 6: Dark Mode / Light Mode

**Attendu:**
- Les couleurs s'adaptent selon le thème
- Les sélecteurs sont lisibles dans les deux modes
- Les infos du modèle s'affichent correctement

**Test:**
```
1. Vérifier que le dashboard est visible en light mode
   ✓ Texte sombre sur fond clair
   ✓ Bordures visibles

2. Basculer en dark mode (si disponible)
   ✓ Texte clair sur fond sombre
   ✓ Les sélecteurs restent lisibles

3. Basculer en light mode
   ✓ Vérifier que tout revient au normal
```

## Test d'Intégration avec les Formulaires

### Test 7: Intégration Stress Predict

Quand le composant StressPredictComponent aura été mis à jour:

**Attendu:**
- En haut du formulaire: sélecteur de modèle Stress
- Le modèle sélectionné est utilisé pour la prédiction
- Le résultat affiche le modèle utilisé

**Test:**
```
1. Naviguer vers Stress > Predict
2. Vérifier que le sélecteur est présent
3. Sélectionner un modèle différent (ex: Stress Random Forest)
4. Remplir le formulaire
5. Cliquer "Prédire"
6. Vérifier dans la réponse:
   ✓ Que le modèle utilisé est le bon
   ✓ Que "model_id" a été envoyé à l'API
```

## Vérification de la Console Navigateur

**Attendu:**
- Pas d'erreurs JavaScript
- Pas d'avertissements TypeScript
- Les logs montrent les changements de modèle

**Test:**
```
1. Ouvrir la console (F12)
2. Onglet "Console"
3. Vérifier:
   ✓ Pas de messages d'erreur rouge
   ✓ Pas d'erreurs "undefined" ou "null"

4. Changer un modèle
5. Vérifier que rien ne break en console
```

## Cas d'Erreur à Tester

### Test 8: Gestion des Erreurs

**Scénario 1: localStorage indisponible**
- Si localStorage est désactivé (paramètres privacy)
- Le système doit encore fonctionner mais sans persistance
- Les sélections se font uniquement en session

**Scénario 2: Corruption du localStorage**
- Ouvrir la console et exécuter:
  ```javascript
  localStorage.setItem('selectedModels', 'données-invalides');
  location.reload();
  ```
- Le dashboard doit se charger sans erreur
- Les sélections doivent être réinitialisées

**Test:**
```
1. Pour Scénario 1:
   a. Désactiver localStorage dans DevTools
   b. Recharger le dashboard
   c. Vérifier que tout marche
   d. Vérifier que les sélections disparaissent au rechargement

2. Pour Scénario 2:
   a. Exécuter le code ci-dessus
   b. Le dashboard doit se charger correctement
   c. Les sélections doivent être réinitialisées par défaut
```

## Performance

### Test 9: Performance Générale

**Attendu:**
- Le dashboard se charge rapidement (< 2s)
- Pas de lag lors du changement de modèle
- Pas de flickering visuel

**Test:**
```
1. Ouvrir DevTools > Lighthouse
2. Faire un audit
3. Vérifier les performances:
   ✓ Score > 80 (idéalement)
   ✓ Time to Interactive < 3s

4. Changer de modèle 10 fois rapidement
5. Vérifier qu'il n'y a pas de lag
```

## Checklist Finale

```
✓ Dashboard accessible
✓ 6 sections avec sélecteurs affichées
✓ Sélection des modèles fonctionnelle
✓ Persiste dans localStorage
✓ Compteur 0-6 sections correct
✓ Responsive design
✓ Dark/Light mode
✓ Console sans erreurs
✓ localStorage corrompu gérée
✓ Performances acceptables
✓ Descriptions visibles et correctes
✓ Précisions affichées correctement
```

## Commandes Utiles de Débogage

```javascript
// Vérifier les modèles stockés
localStorage.getItem('selectedModels')

// Vider les sélections
localStorage.removeItem('selectedModels')

// Inspecter le service (via console dans une page Angular)
// Après injection du service
ng.probe(document.querySelector('app-dashboard')).injector.get(ModelSelectionService).getAllModels()
```

## Rapport de Test

Après avoir complété tous les tests, générer un rapport:
- Tous les tests passent ✓
- Pas d'erreurs détectées
- Performance acceptable
- Design responsive OK
- Persistance fonctionnelle
- Prêt pour l'intégration aux formulaires
