# 🧪 Fichiers de Test - Team Calendar

Ce dossier contient les fichiers de test pour valider les fonctionnalités d'import de calendrier.

## 📁 Fichiers Valides

### 1. `test-calendar.ics`
**Format** : iCalendar (.ics)
**Événements** : 5 événements variés
**Période** : 13 janvier - 14 février 2025

**Contenu** :
- ✅ Semaine École HETIC (13-17 jan)
- ✅ Disponible Entreprise (20-24 jan)
- ✅ Vacances d'hiver (27-31 jan)
- ✅ Formation React (3-7 fév)
- ✅ Absent (10-14 fév)

**Statuts attendus après import** :
- École (détecté via "École" et "Formation")
- Disponible (détecté via "Entreprise")
- Vacances (détecté via "Vacances")
- Indisponible (détecté via "Absent")

---

### 2. `test-calendar.xlsx`
**Format** : Excel (.xlsx)
**Lignes** : 10 événements + 1 en-tête
**Colonnes** : Date début | Date fin | Type

**Contenu** :
- En-têtes en français
- Dates au format Excel (numérique sérialisé)
- Types variés : École, Entreprise, Vacances, Formation, etc.

**Tests** :
- ✅ Parsing des colonnes FR
- ✅ Conversion dates Excel → JS Date
- ✅ Mapping types → statuts

---

### 3. `test-calendar.csv`
**Format** : CSV (comma-separated)
**Lignes** : 10 événements + 1 en-tête
**Séparateur** : `,` (virgule)

**Contenu** : Identique à test-calendar.xlsx

**Tests** :
- ✅ Parsing CSV simple
- ✅ Détection colonnes FR
- ✅ Dates au format ISO (YYYY-MM-DD)

---

## 🐛 Fichiers Edge Cases

### 4. `empty-file.ics`
**But** : Tester la gestion d'un fichier vide
**Erreur attendue** : "Le fichier est vide"

---

### 5. `invalid-format.txt`
**But** : Tester un format non supporté
**Erreur attendue** : "Format de fichier non supporté: .txt"

---

### 6. `invalid-dates.csv`
**But** : Tester des dates incohérentes
**Lignes problématiques** :
- Ligne 2 : Date fin avant date début (20 jan > 15 jan)
- Ligne 3 : Date invalide ("invalid-date")
- Ligne 4 : Date fin manquante

**Warnings attendus** :
- "Ligne 2: Date de fin avant date de début"
- "Ligne 3: Date invalide"
- "Ligne 4: Date de début manquante"

---

## 🚀 Utilisation

### Test Import ICS
1. Lancer l'app : `npm run dev`
2. Ajouter un membre
3. Cliquer "Importer un calendrier"
4. Uploader `test-calendar.ics`
5. Vérifier : 5 événements importés, résumé mis à jour

### Test Import Excel
1. Uploader `test-calendar.xlsx`
2. Vérifier : 10 événements importés
3. Vérifier : colonnes FR détectées
4. Vérifier : types mappés correctement

### Test Import CSV
1. Uploader `test-calendar.csv`
2. Vérifier : même résultat que Excel

### Test Edge Cases
1. Uploader `empty-file.ics` → Erreur "fichier vide"
2. Uploader `invalid-format.txt` → Erreur "format non supporté"
3. Uploader `invalid-dates.csv` → Warnings sur lignes invalides

---

## ✅ Checklist de Validation

- [ ] ICS : 5 événements importés, statuts corrects
- [ ] Excel : 10 événements, colonnes FR détectées
- [ ] CSV : 10 événements, parsing correct
- [ ] Fichier vide : erreur claire
- [ ] Format invalide : message descriptif
- [ ] Dates invalides : warnings ligne par ligne
- [ ] localStorage mis à jour après import
- [ ] Résumé hebdomadaire recalculé
- [ ] Calendrier affiche les badges corrects

---

## 📝 Notes

- Les dates utilisent le format ISO 8601
- Les événements couvrent plusieurs semaines pour tester la navigation
- Les types incluent des synonymes (École/Cours, Entreprise/Travail, etc.)
- Le parser doit détecter automatiquement les statuts via keywords
