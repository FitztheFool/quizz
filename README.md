# 🎯 Quiz App - Application de Quiz Interactive

Application full-stack de quiz avec authentification, scoring et classements.

## ✨ Fonctionnalités

- 🔐 **Authentification sécurisée** (NextAuth.js)
- ✏️ **CRUD complet** pour les utilisateurs et quiz
- 🎲 **3 types de questions** : Vrai/Faux (1pt), QCM (3pts), Texte libre (5pts)
- 🏆 **Système de scoring** avec règles anti-farming
- 📊 **Classements** : global et par quiz
- 🔄 **Rejouer sans limite** (mais 1 seul score comptabilisé)
- 🚫 **Les créateurs ne gagnent pas de points** sur leurs quiz

## 🛠️ Stack Technique

- **Frontend** : Next.js 15 + React + TypeScript + TailwindCSS
- **Backend** : Next.js API Routes
- **Base de données** : PostgreSQL (Neon)
- **ORM** : Prisma
- **Authentification** : NextAuth.js
- **Déploiement** : Vercel (gratuit)

## 🚀 Démarrage rapide

Voir [INSTALLATION.md](./INSTALLATION.md) pour les instructions détaillées.

```bash
# Installation
npm install

# Configuration
cp .env.example .env.local
# Éditer .env.local avec vos credentials

# Initialiser la DB
npx prisma db push
npm run db:seed

# Lancer en dev
npm run dev
```

## 📖 Documentation

- [Architecture technique complète](./ARCHITECTURE.md)
- [Guide d'installation et déploiement](./INSTALLATION.md)

## 📋 Prérequis

- Node.js 18+
- Compte Neon (PostgreSQL gratuit)
- Compte Vercel (déploiement gratuit)

## 🎓 Comptes de test

Après avoir lancé `npm run db:seed` :

- **Alice** : `alice@example.com` / `password123`
- **Bob** : `bob@example.com` / `password123`

## 📄 License

MIT

---

Développé avec ❤️ en utilisant Next.js et Prisma
