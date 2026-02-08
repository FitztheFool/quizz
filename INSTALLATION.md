# 🚀 Guide d'Installation et Déploiement - Quiz App

## 📋 Prérequis

- Node.js 18+ ([télécharger](https://nodejs.org/))
- npm ou yarn
- Compte GitHub (gratuit)
- Compte Neon (gratuit) - [neon.tech](https://neon.tech)
- Compte Vercel (gratuit) - [vercel.com](https://vercel.com)

---

## 🛠️ Installation Locale

### 1️⃣ Cloner ou créer le projet

```bash
# Si vous avez téléchargé le starter kit
cd quiz-app-starter

# Installer les dépendances
npm install
```

### 2️⃣ Configurer la base de données (Neon)

1. **Créer un compte sur Neon** : [neon.tech](https://neon.tech)
2. **Créer un nouveau projet** PostgreSQL
3. **Copier la connection string** (elle ressemble à : `postgresql://username:password@ep-xxx.neon.tech/neondb`)

### 3️⃣ Configurer les variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env.local

# Éditer .env.local avec vos valeurs
```

**Contenu de `.env.local` :**

```env
# Base de données Neon
DATABASE_URL="postgresql://votre-connection-string-neon"

# NextAuth
NEXTAUTH_SECRET="générer-avec-commande-ci-dessous"
NEXTAUTH_URL="http://localhost:3000"
```

**Générer NEXTAUTH_SECRET :**

```bash
openssl rand -base64 32
```

### 4️⃣ Initialiser la base de données

```bash
# Pousser le schéma Prisma vers la DB
npx prisma db push

# Générer le client Prisma
npx prisma generate

# (Optionnel) Seed avec des données de test
npm run db:seed
```

### 5️⃣ Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

**Comptes de test (si vous avez lancé le seed) :**
- Email : `alice@example.com` / Password : `password123`
- Email : `bob@example.com` / Password : `password123`

---

## 🌐 Déploiement sur Vercel (Gratuit)

### Étape 1 : Pousser sur GitHub

```bash
# Initialiser git (si pas déjà fait)
git init
git add .
git commit -m "Initial commit"

# Créer un repo sur GitHub, puis :
git remote add origin https://github.com/votre-username/quiz-app.git
git branch -M main
git push -u origin main
```

### Étape 2 : Connecter Vercel

1. Aller sur [vercel.com](https://vercel.com)
2. Cliquer sur **"Import Project"**
3. Sélectionner votre repo GitHub `quiz-app`
4. Vercel détectera automatiquement Next.js

### Étape 3 : Configurer les variables d'environnement

Dans les **Environment Variables** de Vercel, ajouter :

```
DATABASE_URL=postgresql://votre-connection-string-neon
NEXTAUTH_SECRET=votre-secret-généré
NEXTAUTH_URL=https://votre-app.vercel.app
```

⚠️ **Important** : Remplacer `https://votre-app.vercel.app` par l'URL de production générée par Vercel

### Étape 4 : Déployer

Cliquer sur **"Deploy"** et attendre 2-3 minutes.

### Étape 5 : Mettre à jour NEXTAUTH_URL

Une fois déployé, Vercel vous donne une URL (ex: `quiz-app-abc123.vercel.app`)

1. Retourner dans **Settings → Environment Variables**
2. Mettre à jour `NEXTAUTH_URL` avec la vraie URL
3. **Redéployer** : Settings → Deployments → Redeploy

---

## 🗄️ Prisma Studio (Interface graphique DB)

Pour visualiser et modifier vos données :

```bash
npx prisma studio
```

Ouvre une interface web sur `http://localhost:5555`

---

## 📊 Structure des commandes

| Commande | Description |
|----------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build pour la production |
| `npm start` | Lance la version de production |
| `npm run db:push` | Met à jour le schéma DB |
| `npm run db:seed` | Remplit la DB avec des données de test |
| `npm run db:studio` | Ouvre Prisma Studio |

---

## 🔧 Configuration avancée

### Ajouter des utilisateurs manuellement

```typescript
// Dans Prisma Studio ou via script
import { hash } from 'bcryptjs';

const hashedPassword = await hash('monmotdepasse', 10);

await prisma.user.create({
  data: {
    username: 'newuser',
    email: 'newuser@example.com',
    passwordHash: hashedPassword,
  },
});
```

### Limites du plan gratuit

**Neon (PostgreSQL) :**
- 10 GB de stockage
- 100 heures de compute/mois (largement suffisant)

**Vercel :**
- 100 GB de bande passante/mois
- Fonctions serverless illimitées
- Builds illimités

Ces limites sont **très généreuses** pour un projet personnel ou petit projet.

---

## 🐛 Troubleshooting

### Erreur : "Prisma Client not generated"

```bash
npx prisma generate
```

### Erreur : "Database connection failed"

Vérifier que `DATABASE_URL` dans `.env.local` est correct

### Erreur : "NextAuth secret missing"

Vérifier que `NEXTAUTH_SECRET` est défini dans `.env.local`

### Les images ne s'affichent pas

Ajouter le domaine dans `next.config.js` :

```javascript
images: {
  domains: ['votre-domaine.com'],
}
```

---

## 📚 Prochaines étapes

Une fois le projet déployé :

1. ✅ Créer des quiz personnalisés
2. ✅ Inviter des amis à jouer
3. ✅ Consulter les classements
4. ✅ Ajouter des fonctionnalités (timer, images, catégories...)

---

## 💡 Ressources utiles

- [Documentation Next.js](https://nextjs.org/docs)
- [Documentation Prisma](https://www.prisma.io/docs)
- [Documentation NextAuth.js](https://next-auth.js.org)
- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Neon](https://neon.tech/docs)

---

## 🆘 Support

Pour toute question :
1. Vérifier la documentation
2. Consulter les issues GitHub
3. Demander de l'aide dans les communautés Discord (Next.js, Prisma)

Bon développement ! 🚀
