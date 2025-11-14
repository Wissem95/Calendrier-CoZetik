# 🧪 Guide de Tests Manuels Rapides

## 🚀 Démarrage

```bash
npm run dev
# Ouvrir http://localhost:3000
```

---

## ⚡ Tests Rapides (15 minutes)

### 1️⃣ Test Import ICS (5 min)

**Steps** :
1. Clic "Ajouter un membre" → Nom: "Alice" → Rôle: "Dev" → Valider
2. Clic "Importer un calendrier"
3. Sélectionner Alice
4. Uploader `test-data/test-calendar.ics`

**✅ Vérifications** :
- [ ] Message : "5 événement(s) importé(s)"
- [ ] Calendrier affiche 5 badges colorés
- [ ] Résumé en bas mis à jour
- [ ] Console : aucune erreur

---

### 2️⃣ Test Import Excel (3 min)

**Steps** :
1. Clic "Ajouter un membre" → Nom: "Bob" → Rôle: "Designer" → Valider
2. Clic "Importer un calendrier"
3. Sélectionner Bob
4. Uploader `test-data/test-calendar.xlsx`

**✅ Vérifications** :
- [ ] Message : "10 événement(s) importé(s)"
- [ ] Types détectés : École, Entreprise, Vacances

---

### 3️⃣ Test Import CSV (2 min)

**Steps** :
1. Clic "Ajouter un membre" → Nom: "Charlie" → Valider
2. Importer `test-data/test-calendar.csv`

**✅ Vérifications** :
- [ ] 10 événements importés
- [ ] Identique au résultat Excel

---

### 4️⃣ Test Edge Cases (5 min)

**4.1 Fichier Vide** :
1. Uploader `test-data/empty-file.ics`
2. ✅ Erreur : "Le fichier est vide"

**4.2 Format Invalide** :
1. Uploader `test-data/invalid-format.txt`
2. ✅ Erreur : "Format de fichier non supporté: .txt"

**4.3 Dates Invalides** :
1. Uploader `test-data/invalid-dates.csv`
2. ✅ Warnings affichés :
   - "Ligne 2: Date de fin avant date de début"
   - "Ligne 3: Date invalide"

---

## 🎯 Tests Approfondis (30 minutes)

### 5️⃣ Test Performance

**Steps** :
1. Créer un script pour ajouter 20 membres :

```javascript
// Dans la console du navigateur
const store = window.__ZUSTAND_STORE__; // Si exposé
// Sinon ajouter manuellement ou via script
for (let i = 1; i <= 20; i++) {
  // Ajouter membre via UI
}
```

2. Importer le même fichier .ics pour chaque membre (100+ événements)
3. Naviguer entre semaines (◀ ▶)
4. Ouvrir DevTools → Performance → Record
5. Naviguer 10x entre semaines
6. Stop recording

**✅ Vérifications** :
- [ ] Pas de lag visible
- [ ] Temps de réponse < 100ms
- [ ] Résumé se recalcule rapidement

---

### 6️⃣ Test Responsive

**Steps** :
1. Ouvrir DevTools (F12)
2. Toggle Device Toolbar (Ctrl+Shift+M)
3. Tester les résolutions :

**Mobile (375px)** :
- [ ] Scroll horizontal fonctionne
- [ ] Boutons accessibles
- [ ] Header responsive

**Tablette (768px)** :
- [ ] Layout adapté
- [ ] Calendrier lisible

**Desktop (1920px)** :
- [ ] Contenu centré
- [ ] Pas de débordement

---

### 7️⃣ Test Accessibilité

**Keyboard Navigation** :
- [ ] Tab : focus visible sur boutons
- [ ] Enter : ouvre modal
- [ ] Escape : ferme modal

**Screen Reader** (Si disponible) :
- [ ] Labels corrects sur inputs
- [ ] Boutons ont aria-label
- [ ] Structure sémantique

---

### 8️⃣ Test Persistence

**Steps** :
1. Ajouter 2 membres + 3 événements
2. F5 (rafraîchir)

**✅ Vérifications** :
- [ ] Données toujours présentes
- [ ] LocalStorage → Application → `team-calendar-storage`
- [ ] Format JSON valide

**DevTools Check** :
```json
{
  "state": {
    "members": [...],
    "events": [...],
    "importedCalendars": [...]
  }
}
```

---

### 9️⃣ Test Multi-Browser

**Browsers** :
- [ ] Chrome
- [ ] Firefox
- [ ] Safari (macOS)
- [ ] Edge

**Pour chaque** :
1. Importer un fichier
2. Vérifier affichage
3. Vérifier console (pas d'erreurs)

---

## 🏁 Validation Finale

### Checklist Complète

**Fonctionnalités** :
- [ ] Ajout membre fonctionne
- [ ] Ajout événement fonctionne
- [ ] Import ICS fonctionne
- [ ] Import Excel fonctionne
- [ ] Import CSV fonctionne
- [ ] Navigation semaines fonctionne
- [ ] Résumé se calcule correctement
- [ ] Persistence localStorage OK

**Qualité** :
- [ ] Aucune erreur console
- [ ] Build production réussit
- [ ] Responsive sur mobile/tablette
- [ ] Accessibilité basique OK
- [ ] Performance acceptable

**Edge Cases** :
- [ ] Fichier vide géré
- [ ] Format invalide géré
- [ ] Dates invalides gérées
- [ ] État vide (aucun membre) OK

---

## 📸 Screenshots à Capturer

1. Calendrier vide (état initial)
2. Import success (message vert)
3. Import error (message rouge)
4. Calendrier avec 3 membres
5. Résumé hebdomadaire
6. Modal import ouvert
7. Vue mobile (375px)

---

## ✅ Rapport Final

**Après tous les tests** :
1. Remplir `TEST_REPORT.md` avec résultats
2. Lister les bugs trouvés
3. Créer `BUG_FIXES.md` si nécessaire
4. Mettre à jour README si corrections

---

## 🐛 Si Bug Trouvé

1. **Noter** :
   - Navigateur + version
   - Steps pour reproduire
   - Comportement attendu vs réel
   - Screenshot/console errors

2. **Debug** :
   - Vérifier console
   - Vérifier network tab
   - Vérifier localStorage
   - Tester en incognito

3. **Documenter** dans TEST_REPORT.md

---

**Happy Testing! 🎉**
