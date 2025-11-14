# 📅 Calendar CoZetik - Planning d'Équipe Collaboratif

Application web collaborative de gestion de planning d'équipe avec synchronisation en temps réel.

![Next.js](https://img.shields.io/badge/Next.js-14-black)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Realtime](https://img.shields.io/badge/Realtime-WebSockets-orange)

---

## ✨ Features

### 🧑‍💼 Gestion d'Équipe
- ✅ Ajout/modification/suppression de membres
- ✅ Assignation automatique de couleurs
- ✅ Avatars personnalisés
- ✅ Patterns de rotation configurables

### 📆 Gestion d'Événements
- ✅ Création d'événements (disponible, école, indisponible, vacances)
- ✅ Vue calendrier hebdomadaire
- ✅ Navigation par semaine (précédent/suivant/aujourd'hui)
- ✅ Résumé hebdomadaire intelligent

### 📥 Import de Calendriers
- ✅ Support **ICS** (iCalendar)
- ✅ Support **Excel** (.xlsx, .xls)
- ✅ Support **CSV**
- ✅ Parsing intelligent avec détection automatique de statut
- ✅ Remplacement d'imports existants

### 🔄 Synchronisation Temps Réel
- ✅ **Realtime multi-clients** via Supabase
- ✅ Updates instantanés (<1s de latence)
- ✅ Pas de refresh nécessaire
- ✅ Auto-reconnect si déconnexion

### 🎨 Interface Moderne
- ✅ Design responsive (mobile-first)
- ✅ Animations fluides (Framer Motion)
- ✅ Thème moderne avec Tailwind CSS
- ✅ Loading states et error handling

---

## 🏗️ Architecture

### Stack Technique
```
Frontend:
- Next.js 14 (App Router)
- React 18 + TypeScript 5.5
- Zustand (state management)
- Tailwind CSS + Framer Motion

Backend:
- Supabase (PostgreSQL)
- Next.js API Routes
- Supabase Realtime (WebSockets)
- Supabase Storage (file uploads)

Parsing:
- ical.js (ICS)
- ExcelJS (Excel)
- Custom CSV parser
```

### Architecture Globale
```
┌─────────────────┐
│   React UI      │  ← Composants + Zustand Store
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Next.js API     │  ← API Routes (BFF pattern)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │  ← PostgreSQL + Realtime + Storage
└─────────────────┘
```

---

## 🚀 Quick Start

### Prérequis
- Node.js 18+ ([installer](https://nodejs.org/))
- npm 9+ (inclus avec Node.js)
- Compte Supabase (gratuit: [supabase.com](https://supabase.com))

### Installation Locale (5 minutes)

#### 1. Cloner le projet
```bash
git clone https://github.com/votre-repo/calendar-cozetik.git
cd calendar-cozetik
```

#### 2. Installer les dépendances
```bash
npm install
```

#### 3. Configurer Supabase
Suivez le guide complet: **[SUPABASE-SETUP.md](SUPABASE-SETUP.md)** (15 min)

Résumé rapide:
1. Créer projet Supabase
2. Exécuter [`supabase-setup.sql`](supabase-setup.sql) dans SQL Editor
3. Créer bucket Storage `calendar-files`
4. Copier URL et ANON_KEY dans `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

#### 4. Lancer le serveur
```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) 🎉

---

## 📦 Déploiement Production

### Vercel (Recommandé - Gratuit)
Suivez le guide complet: **[DEPLOYMENT.md](DEPLOYMENT.md)** (10 min)

Résumé rapide:
1. Push code sur GitHub
2. Connecter repo sur [vercel.com](https://vercel.com)
3. Configurer variables d'environnement
4. Deploy! ✅

**Déploiement automatique** à chaque git push sur `main`.

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[SUPABASE-SETUP.md](SUPABASE-SETUP.md)** | Guide installation Supabase (15 min) |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Guide déploiement Vercel (10 min) |
| **[MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md)** | Résumé migration localStorage → Supabase |
| **[supabase-setup.sql](supabase-setup.sql)** | Script SQL complet |

---

## 📂 Structure du Projet

```
calendar-cozetik/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── members/              # CRUD membres
│   │   │   ├── events/               # CRUD événements
│   │   │   └── import/               # Import calendriers
│   │   ├── layout.tsx                # Layout global
│   │   └── page.tsx                  # Page principale
│   │
│   ├── components/
│   │   ├── calendar/                 # Composants calendrier
│   │   │   ├── TeamCalendar.tsx      # Vue hebdomadaire
│   │   │   ├── WeekSummary.tsx       # Résumé semaine
│   │   │   └── CalendarUpload.tsx    # Upload fichiers
│   │   ├── modals/                   # Modales
│   │   │   ├── AddMemberModal.tsx
│   │   │   └── AddEventModal.tsx
│   │   └── ui/                       # Composants UI réutilisables
│   │
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts             # Client Supabase
│       │   └── realtime.ts           # Hooks realtime
│       ├── store.ts                  # Zustand store
│       ├── types.ts                  # TypeScript types
│       ├── calendarParser.ts         # Parser ICS/Excel/CSV
│       └── utils.ts                  # Utilitaires
│
├── public/                           # Assets statiques
├── .env.local                        # Config environnement (à créer)
├── supabase-setup.sql                # Script SQL Supabase
├── SUPABASE-SETUP.md                 # Guide Supabase
├── DEPLOYMENT.md                     # Guide Vercel
├── MIGRATION-SUMMARY.md              # Résumé migration
└── README.md                         # Ce fichier
```

---

## 🔑 Variables d'Environnement

### Développement (`.env.local`)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...

# Next.js
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Production (Vercel)
Les mêmes variables, configurées dans **Vercel Dashboard → Settings → Environment Variables**.

---

## 🛠️ Scripts npm

```bash
# Développement
npm run dev              # Serveur dev (port 3000)

# Production
npm run build            # Build optimisé
npm run start            # Serveur prod

# Code Quality
npm run lint             # Vérifier ESLint
```

---

## 📊 Base de Données

### Schema (3 tables)

#### `team_members`
```sql
id              UUID PRIMARY KEY
name            TEXT NOT NULL
role            TEXT NOT NULL
color           TEXT NOT NULL (format: #RRGGBB)
rotation_pattern TEXT NOT NULL
avatar          TEXT NULLABLE
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### `calendar_events`
```sql
id              UUID PRIMARY KEY
member_id       UUID FK → team_members.id
start_date      TIMESTAMPTZ NOT NULL
end_date        TIMESTAMPTZ NOT NULL
status          TEXT NOT NULL ('available'|'school'|'unavailable'|'vacation')
note            TEXT NULLABLE
is_imported     BOOLEAN DEFAULT FALSE
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

#### `imported_calendars`
```sql
id              UUID PRIMARY KEY
member_id       UUID FK → team_members.id
file_name       TEXT NOT NULL
file_type       TEXT NOT NULL ('ics'|'xlsx'|'csv')
file_url        TEXT NULLABLE
upload_date     TIMESTAMPTZ
created_at      TIMESTAMPTZ
```

---

## 🐛 Troubleshooting

### Erreur: "Missing Supabase environment variables"
**Solution:** Vérifier que `.env.local` existe et contient les bonnes valeurs, puis redémarrer `npm run dev`

### Erreur: "Failed to fetch"
**Solution:** Vérifier URL et ANON_KEY dans Supabase Dashboard → Settings → API

### Realtime ne marche pas
**Solution:** Vérifier dans Supabase → Database → Replication que les tables sont listées

---

## 🚧 Roadmap

### Phase 1 (Actuel) ✅
- [x] CRUD membres et événements
- [x] Import calendriers (ICS/Excel/CSV)
- [x] Synchronisation temps réel
- [x] Déploiement Vercel

### Phase 2 (Prochainement)
- [ ] Authentification (Supabase Auth)
- [ ] Permissions (RLS policies)
- [ ] Export PDF/Excel
- [ ] Vue mensuelle/annuelle
- [ ] Dark mode

---

## 👥 Équipe

**Développé pour:** CoZetic
**Créé par:** Wissem + Claude AI
**Date:** Janvier 2025

---

## 📄 Licence

Propriétaire - CoZetic © 2025

---

<div align="center">

**Made with ❤️ by CoZetic Team**

</div>
