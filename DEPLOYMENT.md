# 🚀 Guide de Déploiement Vercel - Calendar CoZetik

## 📋 Prérequis

- ✅ Projet Supabase configuré ([SUPABASE-SETUP.md](SUPABASE-SETUP.md))
- ✅ `.env.local` configuré localement avec les clés Supabase
- ✅ Code git committé sur GitHub/GitLab/Bitbucket
- ✅ Compte Vercel (gratuit: https://vercel.com/signup)

---

## 🎯 Étapes de Déploiement

### **Étape 1: Connecter Vercel à votre repository** (2 min)

1. Allez sur [https://vercel.com/dashboard](https://vercel.com/dashboard)

2. Cliquez sur **"Add New..."** → **"Project"**

3. Importez votre repository Git:
   - Sélectionnez votre provider (GitHub, GitLab, Bitbucket)
   - Autorisez Vercel à accéder à vos repos
   - Sélectionnez le repo `Calendar-CoZetik`

---

### **Étape 2: Configuration du projet** (3 min)

#### 2.1 - Framework Detection
Vercel détecte automatiquement Next.js. Vérifiez les paramètres:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

**→ Pas de modifications nécessaires** ✅

#### 2.2 - Root Directory
Si votre projet est à la racine du repo:
```
Root Directory: ./
```

Si votre projet est dans un sous-dossier (ex: `frontend/`):
```
Root Directory: ./frontend
```

---

### **Étape 3: Variables d'environnement** (3 min) ⚠️ **ÉTAPE CRITIQUE**

1. Dans la section **"Environment Variables"**, cliquez sur **"Add"**

2. Ajoutez les 3 variables suivantes (copiées depuis votre `.env.local`):

```bash
# Variable 1
Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://xxxxxxxxxxxxx.supabase.co

# Variable 2
Name: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS...

# Variable 3
Name: NEXT_PUBLIC_SITE_URL
Value: https://votre-app.vercel.app
(⚠️ Pour l'instant, mettez une URL temporaire, vous la modifierez après)
```

**Environnements à sélectionner** pour chaque variable:
- ✅ **Production**
- ✅ **Preview** (optionnel mais recommandé)
- ✅ **Development** (optionnel)

---

### **Étape 4: Déployer!** (1 min)

1. Cliquez sur **"Deploy"**

2. ⏳ Attendez 2-3 minutes (Vercel va):
   - Cloner votre repo
   - Installer les dépendances (`npm install`)
   - Builder l'app (`npm run build`)
   - Déployer sur le CDN global

3. ✅ Quand vous voyez **"Your project is ready"** → C'est en ligne!

---

### **Étape 5: Obtenir votre URL de production** (1 min)

1. Copiez l'URL fournie par Vercel:
   ```
   https://calendar-cozetik-xxxxx.vercel.app
   ```

2. **Retournez dans Vercel Settings**:
   - Allez dans **Settings** → **Environment Variables**
   - Trouvez la variable `NEXT_PUBLIC_SITE_URL`
   - Cliquez sur **Edit** (icône crayon)
   - Remplacez par l'URL réelle:
     ```
     https://calendar-cozetik-xxxxx.vercel.app
     ```
   - Cliquez sur **Save**

3. **Redéployez** pour prendre en compte le changement:
   - Allez dans **Deployments**
   - Cliquez sur les 3 points (**...**) du dernier déploiement
   - Cliquez sur **Redeploy**

---

### **Étape 6: Configuration d'un domaine personnalisé** (Optionnel) (5 min)

Si vous avez un domaine (ex: `calendar.cozetik.com`):

1. Allez dans **Settings** → **Domains**

2. Cliquez sur **"Add"**

3. Entrez votre domaine:
   ```
   calendar.cozetik.com
   ```

4. Vercel vous donnera des instructions DNS:
   ```
   Type: CNAME
   Name: calendar
   Value: cname.vercel-dns.com
   ```

5. Ajoutez ce record DNS chez votre registrar (Cloudflare, OVH, etc.)

6. Attendez la propagation DNS (5-30 min)

7. ✅ Votre app sera accessible sur votre domaine!

8. **N'oubliez pas** de mettre à jour `NEXT_PUBLIC_SITE_URL` dans les variables d'environnement:
   ```
   NEXT_PUBLIC_SITE_URL=https://calendar.cozetik.com
   ```

---

## ✅ Vérification du Déploiement

### Test 1: Page charge correctement
```
✅ Ouvrir https://votre-app.vercel.app
✅ La page doit afficher "Chargement des données..."
✅ Puis afficher le calendrier (même vide)
```

### Test 2: Connexion Supabase fonctionne
```
✅ Ouvrir la console navigateur (F12)
✅ Pas d'erreur "Missing Supabase environment variables"
✅ Voir dans les logs: "✅ Initial data loaded: { members: X, events: Y }"
```

### Test 3: Créer un membre
```
✅ Cliquer sur "Ajouter un membre"
✅ Remplir le formulaire
✅ Le membre apparaît dans le calendrier
✅ Vérifier dans Supabase Dashboard → Table Editor → team_members
```

### Test 4: Ajouter un événement
```
✅ Cliquer sur "Ajouter une période"
✅ Sélectionner un membre + dates + statut
✅ L'événement apparaît dans le calendrier
✅ Vérifier dans Supabase → calendar_events
```

### Test 5: Import fichier ICS/Excel/CSV
```
✅ Cliquer sur "Importer un calendrier"
✅ Sélectionner un membre
✅ Uploader un fichier .ics/.xlsx/.csv
✅ Les événements importés apparaissent
✅ Vérifier dans Supabase Storage → calendar-files
```

### Test 6: Realtime synchronization
```
✅ Ouvrir l'app dans 2 navigateurs différents
✅ Ajouter un membre dans le navigateur A
✅ Le membre apparaît automatiquement dans le navigateur B (en temps réel)
✅ Même test avec un événement
```

---

## 🔄 Déploiements Automatiques

Vercel redéploie automatiquement votre app à chaque push sur la branche principale:

```bash
# Sur votre machine locale
git add .
git commit -m "Ajout de nouvelles fonctionnalités"
git push origin main

# → Vercel détecte le push
# → Build automatique
# → Déploiement automatique
# → Accessible en ~2 minutes
```

**Preview Deployments** (déploiements de prévisualisation):
- Chaque pull request crée un déploiement de preview
- URL unique: `https://calendar-cozetik-git-ma-branche.vercel.app`
- Parfait pour tester avant de merge

---

## 🐛 Troubleshooting

### Erreur: "Missing Supabase environment variables"
**Cause:** Variables d'environnement non configurées

**Solution:**
1. Allez dans Vercel → Settings → Environment Variables
2. Vérifiez que les 3 variables sont présentes
3. Redéployez: Deployments → ... → Redeploy

---

### Erreur: "Failed to fetch members"
**Cause:** Supabase URL ou ANON_KEY incorrect

**Solution:**
1. Vérifiez les valeurs dans Supabase Dashboard → Settings → API
2. Copiez-collez exactement (pas d'espaces avant/après)
3. Mettez à jour dans Vercel → Environment Variables
4. Redéployez

---

### Erreur: Build failed - "Module not found"
**Cause:** Dépendance manquante ou erreur TypeScript

**Solution:**
1. Allez dans Vercel → Deployments → cliquez sur le build échoué
2. Lisez les logs (section "Build")
3. Corrigez l'erreur localement:
   ```bash
   npm install  # Réinstaller les dépendances
   npm run build  # Tester le build
   ```
4. Commitez et pushez le fix

---

### Realtime ne fonctionne pas
**Cause:** Realtime pas activé dans Supabase

**Solution:**
1. Allez dans Supabase → Database → Replication
2. Vérifiez que les 3 tables sont listées
3. Si non, réexécutez le script `supabase-setup.sql`
4. Section "Enable Realtime" à la fin du script

---

### Import fichier échoue
**Cause:** Storage bucket pas créé ou pas public

**Solution:**
1. Allez dans Supabase → Storage
2. Vérifiez que le bucket `calendar-files` existe
3. Vérifiez qu'il est **public** (icône 🌐)
4. Si non public:
   - Cliquez sur le bucket
   - Policies → Make public

---

## 📊 Monitoring et Analytics

### Vercel Analytics (Optionnel)
```bash
npm install @vercel/analytics

# Dans src/app/layout.tsx, ajouter:
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Vercel Logs
```
Vercel Dashboard → Your Project → Logs

Voir en temps réel:
- Requêtes API
- Erreurs serveur
- Performances
```

---

## 🔐 Sécurité

### ⚠️ Important: RLS Désactivé
Votre app utilise RLS désactivé (données publiques). **C'est OK pour:**
- Usage interne CoZetic
- Données non sensibles (planning équipe)
- Pas d'informations personnelles

**Si vous voulez activer RLS plus tard** (optionnel):
1. Allez dans `supabase-setup.sql`
2. Commentez les lignes `DISABLE ROW LEVEL SECURITY`
3. Ajoutez des policies RLS (voir doc Supabase)

### Environment Variables
```
✅ NE JAMAIS committer .env.local dans Git
✅ Toujours via Vercel Environment Variables
✅ Les variables NEXT_PUBLIC_* sont exposées au navigateur (OK pour Supabase ANON_KEY)
```

---

## 📈 Performances

### Recommended Vercel Settings
```
Build & Development Settings:
- Node.js Version: 18.x (default)
- Output Directory: .next (default)

Performance:
- Edge Functions: Non requis (API routes standard)
- ISR: Non requis (données temps réel)
- Image Optimization: Activé par défaut
```

### Optimisations Futures
```
- [ ] Add Vercel Edge Config for fast global config
- [ ] Enable Vercel Edge Cache for static assets
- [ ] Add Sentry for error tracking
- [ ] Add Vercel Speed Insights
```

---

## 🎉 C'est Terminé!

Votre Calendar CoZetik est maintenant déployé en production! 🚀

**URL de Production:** https://votre-app.vercel.app

**Features Activées:**
- ✅ CRUD membres et événements
- ✅ Import calendriers (ICS/Excel/CSV)
- ✅ Synchronisation temps réel (Realtime)
- ✅ Stockage fichiers (Storage)
- ✅ Auto-deploy sur git push

**Prochaines Étapes:**
1. Partagez l'URL avec votre équipe CoZetic
2. Testez collaborativement (plusieurs utilisateurs en même temps)
3. Importez vos calendriers réels
4. Profitez! 🎊

---

## 📞 Support

**Problèmes avec Vercel:**
- [Documentation Vercel](https://vercel.com/docs)
- [Support Vercel](https://vercel.com/support)

**Problèmes avec Supabase:**
- [Documentation Supabase](https://supabase.com/docs)
- [Support Supabase](https://supabase.com/support)

**Problèmes avec le code:**
- Vérifier les logs Vercel
- Vérifier les logs Supabase
- Console navigateur (F12)
