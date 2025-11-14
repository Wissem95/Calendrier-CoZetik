# ⚡ Quick Start - Team Calendar

**Version** : 0.1.0
**Statut** : ✅ **PRÊT POUR PRODUCTION**

---

## 🚀 Démarrage Rapide

```bash
# Installation
npm install

# Développement
npm run dev
# → http://localhost:3000

# Production
npm run build && npm start
```

---

## 📁 Structure Projet

```
team-calendar/
├── src/
│   ├── app/           # Pages Next.js
│   ├── components/    # Composants React
│   └── lib/           # Store, types, parsers
├── test-data/         # Fichiers de test (ICS, Excel, CSV)
├── public/            # Assets statiques
└── docs/              # Documentation (8 fichiers)
```

---

## ✅ Tests Rapides (5 minutes)

1. **Lancer l'app** : `npm run dev`
2. **Ajouter un membre** : Clic "Ajouter un membre" → Nom + Rôle
3. **Importer un calendrier** : Clic "Importer" → Upload `test-data/test-calendar.ics`
4. **Vérifier** : 5 événements importés, résumé mis à jour

---

## 📚 Documentation

| Fichier | Usage |
|---------|-------|
| `README.md` | Guide utilisateur complet |
| `MANUAL_TEST_GUIDE.md` | Tests rapides (15 min) |
| `FINAL_REPORT.md` | Rapport exécutif |
| `CHANGELOG.md` | Historique des versions |

---

## 🎯 Fonctionnalités Principales

- ✅ Gestion membres (ajout, modif, suppression)
- ✅ Gestion événements (ajout, modif, suppression)
- ✅ Import calendriers (ICS, Excel, CSV)
- ✅ Navigation hebdomadaire
- ✅ Résumé automatique
- ✅ Persistence localStorage
- ✅ Responsive mobile/tablette/desktop

---

## 🔧 Build & Quality

```bash
# Build production
npm run build
✓ Compiled successfully

# Linting
npm run lint
✓ No ESLint warnings or errors

# Tests automatisés
cd test-data && node automated-test.js
✓ 8/8 tests passés
```

**Métriques** :
- TypeScript : 0 erreurs ✅
- ESLint : 0 erreurs ✅
- Build : 436 KB First Load ✅

---

## 📦 Tech Stack

- **Framework** : Next.js 14.2 + TypeScript 5.5
- **State** : Zustand + Persistence
- **UI** : Tailwind CSS + Framer Motion
- **Parsers** : ical.js, ExcelJS, date-fns

---

## 🐛 Support

**Problème ?**
1. Vider cache : `rm -rf .next && npm run build`
2. Vérifier console (F12)
3. Tester en incognito

**Docs complètes** : Voir `TESTING.md` et `MANUAL_TEST_GUIDE.md`

---

**✨ Made with ❤️ for CoZetik ✨**
