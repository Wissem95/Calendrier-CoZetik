# 📋 Guide de Tests Manuels - Team Calendar

Ce document contient tous les scénarios de tests manuels à effectuer pour valider le fonctionnement de l'application Team Calendar.

---

## 📝 Prérequis

- Application lancée avec `npm run dev`
- Navigateur moderne (Chrome, Firefox, Safari, Edge)
- DevTools du navigateur disponibles (F12)
- LocalStorage activé

---

## 🧪 Scénarios de Test

### 1️⃣ Test Ajout Membre

**Objectif** : Vérifier que l'ajout d'un nouveau membre fonctionne correctement

#### Étapes à suivre

1. Cliquer sur le bouton **"Ajouter un membre"** (bouton bleu en haut)
2. Vérifier que le modal s'ouvre avec le titre "Ajouter un membre"
3. Remplir le champ **"Nom complet"** (requis) : `Jean Dupont`
4. Remplir le champ **"Rôle"** (optionnel) : `Développeur Full-Stack`
5. Le champ **"Rythme d'alternance"** doit être pré-rempli avec `3 semaines entreprise, 1 semaine école`
6. Cliquer sur le bouton **"Ajouter"**

#### Résultats attendus

- ✅ Le modal se ferme automatiquement
- ✅ Le membre apparaît dans la liste du calendrier (tableau)
- ✅ Une **couleur unique** est assignée au membre (visible dans l'avatar circulaire)
- ✅ Le membre est visible dans la colonne de gauche du calendrier
- ✅ Le badge en haut à droite affiche le bon nombre de membres
- ✅ Tous les jours de la semaine affichent un badge gris "-" (aucun événement)

#### Points de vérification

- [ ] Modal s'ouvre et se ferme correctement
- [ ] Bouton "Ajouter" **désactivé** si le nom est vide
- [ ] Couleur attribuée automatiquement (cycle dans la palette de 8 couleurs)
- [ ] Nom et rôle affichés correctement dans le calendrier
- [ ] Formulaire réinitialisé après ajout

---

### 2️⃣ Test Ajout Événement

**Objectif** : Vérifier que l'ajout d'un événement pour un membre fonctionne correctement

#### Prérequis

- Au moins **1 membre** ajouté au préalable

#### Étapes à suivre

1. Cliquer sur le bouton **"Ajouter une période"**
2. Vérifier que le modal s'ouvre avec le titre "Ajouter une période"
3. Sélectionner un membre dans le dropdown **"Membre"**
4. Sélectionner le statut **"École"** (bouton bleu)
5. Définir la **date de début** : premier jour de la semaine actuelle (lundi)
6. Définir la **date de fin** : dernier jour de la semaine actuelle (vendredi)
7. (Optionnel) Ajouter une note : `Semaine de cours à HETIC`
8. Cliquer sur **"Ajouter"**

#### Résultats attendus

- ✅ Le modal se ferme automatiquement
- ✅ Les jours de lundi à vendredi affichent un **badge bleu "École"** pour le membre sélectionné
- ✅ Le **résumé hebdomadaire** en bas de page se met à jour :
  - Le membre est affiché dans la section **"À l'école (1)"**
  - Le badge du membre est bleu (**info**)
- ✅ Les jours samedi et dimanche affichent toujours le badge gris "-"

#### Points de vérification

- [ ] Dropdown membre affiche tous les membres ajoutés
- [ ] Bouton "Ajouter" **désactivé** si aucun membre sélectionné
- [ ] Les 4 statuts sont disponibles (Disponible, École, Indisponible, Vacances)
- [ ] Date de fin automatiquement ajustée si < date de début
- [ ] Badges de statut colorés correctement dans le calendrier
- [ ] Résumé hebdomadaire mis à jour immédiatement

---

### 3️⃣ Test Résumé Automatique

**Objectif** : Vérifier la logique de calcul du statut dominant et la catégorisation des membres

#### Étapes à suivre

1. **Ajouter 3 membres** :
   - Membre 1 : `Alice Martin - Designer`
   - Membre 2 : `Bob Leroy - Développeur`
   - Membre 3 : `Charlie Dubois - Chef de projet`

2. **Ajouter les événements suivants** :

   **Pour Alice (école toute la semaine)** :
   - Statut : École
   - Du lundi au vendredi (5 jours)

   **Pour Bob (entreprise toute la semaine)** :
   - Statut : Disponible
   - Du lundi au vendredi (5 jours)

   **Pour Charlie (mix : 3j école, 2j entreprise)** :
   - Événement 1 : École, du lundi au mercredi (3 jours)
   - Événement 2 : Disponible, jeudi et vendredi (2 jours)

3. Vérifier le **résumé hebdomadaire** en bas de page

#### Résultats attendus

**Résumé Semaine X** :

- ✅ **À l'école (1)** :
  - Alice Martin avec badge bleu "Designer"

- ✅ **En entreprise (2)** :
  - Bob Leroy avec badge vert "Développeur"
  - Charlie Dubois avec badge vert "Chef de projet" (statut dominant = école avec 3 jours)

- ✅ **Compteur total** : 3 membres

#### Points de vérification

- [ ] Logique de statut dominant correcte (compte le nombre d'occurrences)
- [ ] Charlie classé dans "À l'école" car 3 jours école > 2 jours entreprise
- [ ] Compteurs exacts dans chaque section
- [ ] Couleurs de badge appropriées (vert, bleu, rouge, jaune)
- [ ] Aucun membre dupliqué dans plusieurs sections

---

### 4️⃣ Test Persistence (LocalStorage)

**Objectif** : Vérifier que les données sont sauvegardées et restaurées automatiquement

#### Étapes à suivre

1. **Ajouter au moins** :
   - 2 membres
   - 3 événements (différents statuts)

2. **Rafraîchir la page** (F5 ou Ctrl+R / Cmd+R)

3. **Ouvrir les DevTools** :
   - Appuyer sur F12 (ou Cmd+Option+I sur Mac)
   - Aller dans l'onglet **"Application"** (Chrome) ou **"Storage"** (Firefox)
   - Sélectionner **LocalStorage** → `http://localhost:3000` (ou port utilisé)
   - Chercher la clé **`team-calendar-storage`**

4. Cliquer sur la clé pour voir le contenu JSON

#### Résultats attendus

- ✅ Après rafraîchissement, **toutes les données sont toujours présentes** :
  - Membres affichés dans le calendrier
  - Événements visibles avec leurs badges de statut
  - Résumé hebdomadaire correct

- ✅ Dans LocalStorage, la clé `team-calendar-storage` contient :
  ```json
  {
    "state": {
      "members": [...],  // Tableau des membres
      "events": [...],   // Tableau des événements
      "importedCalendars": []
    },
    "version": 0
  }
  ```

- ✅ Les **dates sont au format ISO 8601** (ex : `"2024-01-15T00:00:00.000Z"`)

#### Points de vérification

- [ ] Données persistées après F5
- [ ] Clé LocalStorage `team-calendar-storage` existe
- [ ] Format JSON valide et lisible
- [ ] Dates stockées en ISO string
- [ ] Dates restaurées correctement en objets Date
- [ ] Aucune perte de données après rechargement

---

### 5️⃣ Test Navigation entre Semaines

**Objectif** : Vérifier la navigation temporelle et l'affichage des événements par semaine

#### Étapes à suivre

1. **Ajouter un membre** : `Thomas Renard - DevOps`

2. **Ajouter un événement pour la semaine prochaine** :
   - Membre : Thomas Renard
   - Statut : Vacances
   - Date : du lundi prochain au vendredi prochain

3. Vérifier que l'événement **n'est PAS visible** dans la semaine actuelle

4. Cliquer sur le bouton **flèche droite (→)** pour aller à la semaine suivante

5. Vérifier que l'événement est maintenant **visible** (badges jaunes "Congé")

6. Cliquer sur le bouton **"Aujourd'hui"**

7. Vérifier le retour à la semaine actuelle

#### Résultats attendus

- ✅ **Semaine actuelle** : aucun badge pour Thomas
- ✅ **Semaine prochaine** : badges jaunes "Congé" du lundi au vendredi
- ✅ Bouton **"Aujourd'hui"** ramène à la semaine courante
- ✅ Titre affiche **"Semaine X - 2024"** avec le bon numéro
- ✅ Sous-titre affiche la **plage de dates** (ex : "13 janvier - 19 janvier 2024")

#### Points de vérification

- [ ] Navigation ← / → fonctionne
- [ ] Bouton "Aujourd'hui" fonctionne
- [ ] Événements filtrés par semaine
- [ ] Numéro de semaine ISO correct
- [ ] Plage de dates affichée correctement
- [ ] Jour actuel surligné en jaune (si dans la semaine)

---

### 6️⃣ Test Validation des Formulaires

**Objectif** : Vérifier que les validations empêchent les saisies invalides

#### Test 6.1 : Modal Membre - Validation du nom

**Étapes** :
1. Ouvrir le modal "Ajouter un membre"
2. Laisser le champ **"Nom complet"** vide
3. Essayer de cliquer sur "Ajouter"

**Résultat attendu** :
- ✅ Bouton "Ajouter" **désactivé** (grisé, non cliquable)

**Étapes supplémentaires** :
4. Taper un nom (ex : "Marie")
5. Vérifier que le bouton "Ajouter" devient **actif**

#### Test 6.2 : Modal Événement - Validation du membre

**Étapes** :
1. Ouvrir le modal "Ajouter une période"
2. Laisser le dropdown **"Membre"** sur "Sélectionner un membre"
3. Essayer de cliquer sur "Ajouter"

**Résultat attendu** :
- ✅ Bouton "Ajouter" **désactivé**

#### Test 6.3 : Modal Événement - Validation des dates

**Étapes** :
1. Ouvrir le modal "Ajouter une période"
2. Sélectionner un membre
3. Définir **date de début** : 15 janvier 2024
4. Définir **date de fin** : 10 janvier 2024 (avant la date de début)

**Résultat attendu** :
- ✅ Le champ **"Date de fin"** a un attribut `min` égal à la date de début
- ✅ Le navigateur **bloque** la saisie d'une date de fin antérieure
- ✅ Si vous changez la date de début, la date de fin s'ajuste automatiquement

#### Points de vérification

- [ ] Validation HTML5 native fonctionne
- [ ] Boutons désactivés sans champs requis
- [ ] Attribut `required` sur champs obligatoires
- [ ] Validation des dates (fin ≥ début)
- [ ] Messages d'erreur clairs (navigateur natif)

---

## 🐛 Bugs Connus à Vérifier

### 🕐 Issue 1 : Timezone (UTC vs Locale)

**Description** : Les dates peuvent être décalées d'un jour selon le fuseau horaire

**Test** :
1. Ajouter un événement pour le 15 janvier
2. Vérifier dans DevTools → LocalStorage que la date est stockée en UTC
3. Rafraîchir et vérifier que l'événement s'affiche le bon jour

**Vérification** :
- [ ] Les dates sont normalisées avec `startOfDay()` et `endOfDay()`
- [ ] Pas de décalage d'un jour après rechargement
- [ ] Affichage cohérent entre le formulaire et le calendrier

---

### 🎨 Issue 2 : Gestion des Couleurs après Suppression

**Description** : Après suppression d'un membre, les couleurs peuvent se réattribuer

**Test** :
1. Ajouter 3 membres (ils auront les couleurs #3B82F6, #10B981, #F59E0B)
2. Supprimer le 2ème membre (vert)
3. Ajouter un nouveau membre
4. Vérifier la couleur attribuée

**Vérification** :
- [ ] Le nouveau membre prend la couleur suivante dans la palette
- [ ] Index basé sur `members.length % MEMBER_COLORS.length`
- [ ] Pas de duplication de couleurs visibles

**Bug potentiel** :
- Si on supprime un membre, l'index se recalcule. Le nouveau membre pourrait avoir une couleur similaire à un membre existant

---

### ⚡ Issue 3 : Performance avec Beaucoup d'Événements

**Description** : L'application peut ralentir avec un grand nombre d'événements

**Test** :
1. Ajouter 10 membres
2. Ajouter 100+ événements (script ou manuellement)
3. Naviguer entre les semaines
4. Ouvrir DevTools → Performance
5. Enregistrer une session et vérifier les re-renders

**Vérification** :
- [ ] Le `useMemo` dans [page.tsx:28](src/app/page.tsx#L28) optimise bien le calcul du résumé
- [ ] Les dépendances `[getWeekSummary, selectedWeek, members, events]` sont correctes
- [ ] Pas de re-calculs inutiles
- [ ] Pas de lags lors de la navigation

**Optimisations possibles** :
- Virtualisation pour le tableau calendrier (react-window)
- Pagination des semaines
- Lazy loading des événements

---

## ✅ Checklist de Validation Finale

Avant de considérer l'application comme fonctionnelle, vérifier que **tous** ces points sont OK :

### Fonctionnalités CRUD

- [ ] **Ajout membre** : fonctionne, couleur assignée, visible dans calendrier
- [ ] **Ajout événement** : fonctionne, badges colorés, résumé mis à jour
- [ ] **Suppression membre** : supprime aussi les événements associés
- [ ] **Suppression événement** : met à jour le calendrier et le résumé

### Calculs et Logique Métier

- [ ] **Statut dominant** : calcul correct basé sur le nombre d'occurrences
- [ ] **Catégorisation** : membres dans les bonnes sections (entreprise, école, indisponible)
- [ ] **Compteurs** : nombres exacts dans le résumé hebdomadaire
- [ ] **Filtrage par semaine** : seuls les événements de la semaine affichés

### Persistence et Données

- [ ] **LocalStorage** : sauvegarde automatique après chaque action
- [ ] **Rechargement** : données restaurées correctement après F5
- [ ] **Dates** : format ISO en storage, objets Date en mémoire
- [ ] **Migration** : clé `team-calendar-storage` avec version 0

### UX et Validation

- [ ] **Boutons désactivés** : si champs requis manquants
- [ ] **Validation dates** : fin ≥ début
- [ ] **Reset formulaires** : après ajout ou annulation
- [ ] **État vide** : message explicite si aucun membre
- [ ] **Feedback visuel** : animations, couleurs, badges

### Navigation

- [ ] **Semaine précédente** : bouton ← fonctionne
- [ ] **Semaine suivante** : bouton → fonctionne
- [ ] **Aujourd'hui** : retour à la semaine actuelle
- [ ] **Numéro de semaine** : ISO correct (1-53)
- [ ] **Plage de dates** : affichage cohérent

---

## 🔧 Outils Recommandés

### DevTools Extensions

- **React Developer Tools** : inspecter les props et state
- **Redux DevTools** : non applicable (Zustand)
- **Zustand DevTools** : via middleware (à installer si besoin)

### Tests Automatisés (futur)

Pour automatiser ces tests manuels, considérer :
- **Playwright** ou **Cypress** pour les tests E2E
- **Jest + React Testing Library** pour les tests unitaires
- **MSW** pour mocker les imports de fichiers

---

## 📞 Support

En cas de bug ou comportement inattendu :
1. Vider le LocalStorage : DevTools → Application → Clear storage
2. Rafraîchir en mode incognito (Ctrl+Shift+N)
3. Vérifier la console pour les erreurs
4. Tester sur un autre navigateur

**Happy Testing! 🚀**
