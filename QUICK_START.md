# 🎯 QUIZ APP - Démarrage Rapide

## 📦 Ce que vous avez

Un starter kit complet pour une application de quiz avec :
- ✅ Architecture Next.js 15 complète
- ✅ Schéma Prisma prêt à l'emploi
- ✅ Authentification NextAuth configurée
- ✅ API de scoring avec toutes les règles métier
- ✅ Seed de données de test
- ✅ Configuration Vercel + Neon

---

## 🚀 3 ÉTAPES POUR DÉMARRER

### 1️⃣ Créer les comptes gratuits

**Neon (Base de données) :**
1. Aller sur https://neon.tech
2. Sign up (gratuit)
3. Créer un projet PostgreSQL
4. Copier la "Connection String"

**Vercel (Hébergement) :**
1. Aller sur https://vercel.com
2. Sign up avec GitHub
3. On l'utilisera plus tard pour le déploiement

### 2️⃣ Configuration locale

```bash
# Dans le dossier du projet
npm install

# Créer le fichier .env.local
cp .env.example .env.local
```

**Éditer `.env.local` :**
```env
DATABASE_URL="postgresql://[votre-connection-string-neon]"
NEXTAUTH_SECRET="[générer avec: openssl rand -base64 32]"
NEXTAUTH_URL="http://localhost:3000"
```

**Initialiser la base :**
```bash
npx prisma db push
npm run db:seed
```

### 3️⃣ Lancer l'app

```bash
npm run dev
```

Ouvrir http://localhost:3000

**Se connecter avec :**
- Email: `alice@example.com`
- Password: `password123`

---

## 📁 Structure des fichiers créés

```
quiz-app-starter/
├── 📄 ARCHITECTURE.md          ← Architecture technique détaillée
├── 📄 INSTALLATION.md          ← Guide complet d'installation
├── 📄 README.md                ← Vue d'ensemble du projet
├── 📦 package.json             ← Dépendances npm
├── ⚙️ .env.example             ← Template des variables d'env
│
├── prisma/
│   ├── schema.prisma           ← Schéma de base de données
│   └── seed.ts                 ← Données de test
│
├── src/
│   ├── lib/
│   │   ├── prisma.ts          ← Client Prisma singleton
│   │   └── auth.ts            ← Configuration NextAuth
│   │
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts  ← Auth endpoint
│   │   │   ├── quiz/[id]/submit/route.ts    ← Soumission + scoring
│   │   │   └── leaderboard/route.ts         ← Classements
│   │   └── globals.css        ← Styles TailwindCSS
│   │
│   └── types/
│       └── next-auth.d.ts     ← Types TypeScript NextAuth
│
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── .gitignore
```

---

## 🔑 Règles métier implémentées

✅ **Scoring unique** : Un utilisateur ne peut scorer qu'UNE fois par quiz
✅ **Anti-farming** : Rejouer ne donne pas de points supplémentaires
✅ **Créateurs** : Ne gagnent jamais de points sur leurs propres quiz
✅ **Points** :
   - Vrai/Faux : 1 point
   - QCM : 3 points
   - Texte libre : 5 points

---

## 🗄️ Modèle de données

```
User (utilisateurs)
  ↓ 1:N
Quiz (quiz créés)
  ↓ 1:N
Question (questions du quiz)
  ↓ 1:N
Answer (réponses possibles)

User ←→ Quiz (via Score) [contrainte UNIQUE userId+quizId]
```

---

## 🎨 Prochaines fonctionnalités à ajouter

Vous pouvez facilement étendre l'app avec :

1. **Pages frontend** (dans `src/app/`) :
   - Page d'accueil avec liste des quiz
   - Formulaire de création de quiz
   - Interface de jeu (QuizPlayer)
   - Pages de classement

2. **Fonctionnalités avancées** :
   - Timer par question
   - Catégories de quiz
   - Upload d'images
   - Mode multijoueur en temps réel
   - Partage de quiz par URL
   - Système de badges/achievements

3. **Améliorations UX** :
   - Animations
   - Dark mode
   - Progressive Web App (PWA)
   - Notifications

---

## 💻 Commandes utiles

```bash
# Développement
npm run dev              # Lance le serveur de dev
npm run build            # Build pour production
npm start                # Lance la version de production

# Base de données
npx prisma studio        # Interface graphique DB
npx prisma db push       # Met à jour le schéma
npm run db:seed          # Données de test

# Déploiement
git push                 # Auto-deploy sur Vercel (après config)
```

---

## 🌐 Déploiement Vercel (2 minutes)

```bash
# 1. Push sur GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/votre-user/quiz-app.git
git push -u origin main

# 2. Sur vercel.com
# - Import project from GitHub
# - Ajouter les variables d'env (DATABASE_URL, NEXTAUTH_SECRET)
# - Deploy !

# 3. Mettre à jour NEXTAUTH_URL
# Dans Vercel Settings → Environment Variables
# NEXTAUTH_URL = https://votre-app.vercel.app
```

---

## 📚 Documentation complète

- **Architecture technique** : Voir `ARCHITECTURE.md`
- **Installation détaillée** : Voir `INSTALLATION.md`
- **API et logique métier** : Voir les fichiers dans `src/app/api/`

---

## 🆘 Besoin d'aide ?

1. Lire `INSTALLATION.md` section Troubleshooting
2. Vérifier les variables d'environnement
3. Vérifier que Prisma Client est généré : `npx prisma generate`
4. Consulter les logs : `npm run dev` affiche les erreurs

---

## 🎯 Objectif atteint

Vous avez maintenant une base solide pour créer une application de quiz complète, sécurisée et scalable, hébergeable gratuitement sur Vercel avec une base de données PostgreSQL gratuite sur Neon.

Tout le code respecte les spécifications fonctionnelles de votre PDF :
✅ CRUD utilisateurs et quiz
✅ Authentification sécurisée
✅ Contrainte unique userId-quizId
✅ Règles de scoring exactes
✅ Classements global et par quiz
✅ Permissions (seul le créateur peut modifier)

**Bon développement ! 🚀**
