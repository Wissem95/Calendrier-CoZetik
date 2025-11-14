# 🚀 Guide d'installation Supabase - Calendar CoZetik

## 📋 Prérequis
- Compte Supabase existant ✅
- Accès à la console Supabase

---

## 🎯 Étapes d'Installation (15 minutes)

### **Étape 1: Créer un nouveau projet Supabase** (2 min)

1. Allez sur [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Cliquez sur **"New project"**
3. Remplissez les informations:
   - **Name**: `calendar-cozetik` (ou votre choix)
   - **Database Password**: Choisissez un mot de passe fort (NOTEZ-LE!)
   - **Region**: `Europe West (Paris)` (pour meilleures performances)
   - **Pricing Plan**: Free (suffisant pour ce projet)
4. Cliquez sur **"Create new project"**
5. ⏳ Attendez 2-3 minutes que le projet soit provisionné

---

### **Étape 2: Exécuter le script SQL** (3 min)

1. Dans votre projet Supabase, allez dans le menu de gauche:
   - Cliquez sur **SQL Editor** (icône terminal)

2. Cliquez sur **"New query"**

3. Copiez **TOUT** le contenu du fichier `supabase-setup.sql` (à la racine du projet)

4. Collez-le dans l'éditeur SQL

5. Cliquez sur **"Run"** (bouton vert en bas à droite)

6. ✅ Vous devriez voir:
   ```
   Success. No rows returned
   ```

7. Vérification rapide - Exécutez cette requête pour confirmer:
   ```sql
   SELECT table_name FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('team_members', 'calendar_events', 'imported_calendars');
   ```

   Vous devriez voir 3 lignes (les 3 tables).

---

### **Étape 3: Créer le bucket Storage** (2 min)

1. Dans le menu de gauche, cliquez sur **Storage**

2. Cliquez sur **"Create a new bucket"**

3. Remplissez:
   - **Name**: `calendar-files` (⚠️ nom exact requis)
   - **Public bucket**: ✅ **Coché** (activé)
   - **File size limit**: 50 MB (par défaut)

4. Cliquez sur **"Create bucket"**

5. ✅ Le bucket apparaît dans la liste

---

### **Étape 4: Récupérer les clés API** (1 min)

1. Dans le menu de gauche, cliquez sur **Settings** (roue dentée en bas)

2. Cliquez sur **API** dans le sous-menu

3. Vous verrez deux sections importantes:

   **A. Project URL**
   ```
   https://xxxxxxxxxxxxx.supabase.co
   ```
   → Copiez cette URL

   **B. Project API keys**
   - Trouvez la clé **"anon" "public"**
   - Elle commence par `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Cliquez sur **"Copy"**

---

### **Étape 5: Configurer .env.local** (1 min)

1. Ouvrez le fichier `.env.local` à la racine du projet

2. Remplacez les valeurs par vos clés:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...

# Next.js Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

3. Sauvegardez le fichier

---

### **Étape 6: Vérification finale** (2 min)

#### Test 1: Connexion Supabase
```bash
npm run dev
```

Si aucune erreur "Missing Supabase environment variables" n'apparaît dans la console → ✅ OK

#### Test 2: Vérifier les tables dans Supabase
1. Allez dans **Table Editor** dans Supabase
2. Vous devriez voir 3 tables:
   - `team_members`
   - `calendar_events`
   - `imported_calendars`

#### Test 3: Vérifier Realtime activé
1. Dans **Database** → **Replication**
2. Vous devriez voir vos 3 tables listées avec "Realtime" activé

---

## 🎉 C'est terminé!

Votre Supabase est maintenant configuré. L'application utilisera automatiquement la base de données dès que les API routes seront implémentées.

---

## 📊 Architecture de la base de données

```
team_members (membres de l'équipe)
├── id (UUID, primary key)
├── name (text)
├── role (text)
├── color (text, format: #RRGGBB)
├── rotation_pattern (text)
├── avatar (text, nullable)
├── created_at (timestamptz)
└── updated_at (timestamptz)

calendar_events (événements calendrier)
├── id (UUID, primary key)
├── member_id (UUID, foreign key → team_members.id)
├── start_date (timestamptz)
├── end_date (timestamptz)
├── status (text: 'available'|'school'|'unavailable'|'vacation')
├── note (text, nullable)
├── is_imported (boolean)
├── created_at (timestamptz)
└── updated_at (timestamptz)

imported_calendars (fichiers importés)
├── id (UUID, primary key)
├── member_id (UUID, foreign key → team_members.id)
├── file_name (text)
├── file_type (text: 'ics'|'xlsx'|'csv')
├── file_url (text, nullable)
├── upload_date (timestamptz)
└── created_at (timestamptz)
```

---

## 🔧 Commandes utiles

### Insérer des données de test (optionnel)
Allez dans SQL Editor et exécutez:

```sql
-- Ajouter un membre de test
INSERT INTO team_members (name, role, color, rotation_pattern)
VALUES ('John Doe', 'Développeur', '#3B82F6', 'Temps plein');

-- Vérifier
SELECT * FROM team_members;
```

### Vider toutes les données (reset)
```sql
TRUNCATE TABLE calendar_events, imported_calendars, team_members CASCADE;
```

### Voir les statistiques
```sql
SELECT
  'team_members' as table_name, COUNT(*) as count FROM team_members
UNION ALL
SELECT
  'calendar_events', COUNT(*) FROM calendar_events
UNION ALL
SELECT
  'imported_calendars', COUNT(*) FROM imported_calendars;
```

---

## 🐛 Troubleshooting

### Erreur: "Missing Supabase environment variables"
- Vérifiez que `.env.local` est bien à la racine du projet
- Vérifiez qu'il n'y a pas d'espaces avant/après les valeurs
- Redémarrez le serveur Next.js (`npm run dev`)

### Erreur: "Failed to fetch"
- Vérifiez que votre projet Supabase est bien actif
- Vérifiez l'URL dans `.env.local`
- Vérifiez que RLS est bien désactivé sur les tables

### Erreur: "relation does not exist"
- Les tables n'ont pas été créées correctement
- Réexécutez le script `supabase-setup.sql`

### Storage: Erreur upload fichier
- Vérifiez que le bucket `calendar-files` est bien créé
- Vérifiez qu'il est bien en mode **public**
- Allez dans Storage → calendar-files → Policies → Make public

---

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez la [documentation Supabase](https://supabase.com/docs)
2. Vérifiez les logs dans Supabase Dashboard → Logs
3. Vérifiez la console navigateur (F12) pour les erreurs JavaScript

---

## ✅ Checklist finale

- [ ] Projet Supabase créé
- [ ] Script SQL exécuté (3 tables créées)
- [ ] RLS désactivé (vérifié dans Table Editor)
- [ ] Realtime activé (vérifié dans Database → Replication)
- [ ] Bucket Storage créé (`calendar-files`, public)
- [ ] `.env.local` configuré avec URL + ANON_KEY
- [ ] Serveur Next.js démarre sans erreur

**Quand tout est ✅ → Prêt pour l'étape suivante (API Routes)!**
