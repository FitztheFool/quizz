# Architecture Technique - Site de Quiz

## 📋 Vue d'ensemble

**Stack complète** : Next.js 15 + TypeScript + Prisma + PostgreSQL (Neon) + NextAuth.js + TailwindCSS

---

## 🏗️ Structure du projet

```
quiz-app/
├── src/
│   ├── app/                    # App Router Next.js
│   │   ├── (auth)/            # Routes d'authentification
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (app)/             # Routes protégées
│   │   │   ├── dashboard/     # Tableau de bord utilisateur
│   │   │   ├── quiz/
│   │   │   │   ├── [id]/      # Jouer à un quiz
│   │   │   │   ├── create/    # Créer un quiz
│   │   │   │   └── edit/[id]/ # Éditer un quiz
│   │   │   ├── leaderboard/   # Classements
│   │   │   └── profile/       # Profil utilisateur
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # NextAuth endpoints
│   │   │   ├── quiz/          # CRUD Quiz
│   │   │   ├── score/         # Scoring & classements
│   │   │   └── user/          # Gestion utilisateurs
│   │   ├── layout.tsx
│   │   └── page.tsx           # Landing page
│   ├── components/            # Composants réutilisables
│   │   ├── quiz/
│   │   │   ├── QuizCard.tsx
│   │   │   ├── QuestionForm.tsx
│   │   │   └── QuizPlayer.tsx
│   │   ├── leaderboard/
│   │   └── ui/                # Composants UI de base
│   ├── lib/                   # Utilitaires
│   │   ├── prisma.ts          # Client Prisma singleton
│   │   ├── auth.ts            # Config NextAuth
│   │   ├── validations.ts     # Schémas Zod
│   │   └── utils.ts
│   └── types/                 # Types TypeScript
├── prisma/
│   ├── schema.prisma          # Schéma de base de données
│   └── seed.ts                # Données de test
├── public/
├── .env.local                 # Variables d'environnement
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🗄️ Schéma Prisma complet

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  ADMIN
}

enum QuestionType {
  TRUE_FALSE
  MCQ
  TEXT
}

model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String   @unique
  passwordHash  String
  role          Role     @default(USER)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  createdQuizzes Quiz[]
  scores         Score[]

  @@map("users")
}

model Quiz {
  id          String   @id @default(cuid())
  title       String
  description String?  @db.Text
  isPublic    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  creatorId String
  creator   User   @relation(fields: [creatorId], references: [id], onDelete: Cascade)

  questions Question[]
  scores    Score[]

  @@index([creatorId])
  @@index([isPublic])
  @@map("quizzes")
}

model Question {
  id        String       @id @default(cuid())
  type      QuestionType
  content   String       @db.Text
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt

  // Relations
  quizId  String
  quiz    Quiz     @relation(fields: [quizId], references: [id], onDelete: Cascade)
  answers Answer[]

  @@index([quizId])
  @@map("questions")
}

model Answer {
  id        String   @id @default(cuid())
  content   String   @db.Text
  isCorrect Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@index([questionId])
  @@map("answers")
}

model Score {
  id          String   @id @default(cuid())
  totalScore  Int
  completedAt DateTime @default(now())

  // Relations
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  quizId String
  quiz   Quiz   @relation(fields: [quizId], references: [id], onDelete: Cascade)

  // Contrainte UNIQUE : un utilisateur ne peut scorer qu'une fois par quiz
  @@unique([userId, quizId])
  @@index([userId])
  @@index([quizId])
  @@index([totalScore])
  @@map("scores")
}
```

---

## 🔐 Configuration NextAuth.js

```typescript
// src/lib/auth.ts

import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import prisma from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
};
```

---

## 🎯 Logique de Scoring (serveur)

```typescript
// src/app/api/quiz/[id]/submit/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { answers } = await req.json(); // { questionId: answerId[] }
  const quizId = params.id;
  const userId = session.user.id;

  // 1. Vérifier si le quiz existe
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        include: { answers: true },
      },
    },
  });

  if (!quiz) {
    return NextResponse.json({ error: "Quiz introuvable" }, { status: 404 });
  }

  // 2. Vérifier si l'utilisateur est le créateur (pas de points)
  if (quiz.creatorId === userId) {
    return NextResponse.json({
      message: "Les créateurs ne gagnent pas de points sur leurs propres quiz",
      score: 0,
      canReplay: true,
    });
  }

  // 3. Vérifier si l'utilisateur a déjà complété ce quiz
  const existingScore = await prisma.score.findUnique({
    where: {
      userId_quizId: {
        userId,
        quizId,
      },
    },
  });

  if (existingScore) {
    // Peut rejouer mais ne gagne pas de points supplémentaires
    return NextResponse.json({
      message: "Vous avez déjà complété ce quiz",
      score: existingScore.totalScore,
      canReplay: true,
      alreadyCompleted: true,
    });
  }

  // 4. Calculer le score
  let totalScore = 0;

  for (const question of quiz.questions) {
    const userAnswerIds = answers[question.id] || [];
    const correctAnswers = question.answers.filter((a) => a.isCorrect);
    const correctAnswerIds = correctAnswers.map((a) => a.id);

    // Vérifier si la réponse est correcte
    const isCorrect =
      userAnswerIds.length === correctAnswerIds.length &&
      userAnswerIds.every((id: string) => correctAnswerIds.includes(id));

    if (isCorrect) {
      switch (question.type) {
        case "TRUE_FALSE":
          totalScore += 1;
          break;
        case "MCQ":
          totalScore += 3;
          break;
        case "TEXT":
          totalScore += 5;
          break;
      }
    }
  }

  // 5. Enregistrer le score (première tentative uniquement)
  await prisma.score.create({
    data: {
      userId,
      quizId,
      totalScore,
    },
  });

  return NextResponse.json({
    message: "Score enregistré avec succès",
    score: totalScore,
    canReplay: true,
  });
}
```

---

## 📊 API Classements

```typescript
// src/app/api/leaderboard/route.ts

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Classement global
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const quizId = searchParams.get("quizId");

  if (quizId) {
    // Classement par quiz
    const scores = await prisma.score.findMany({
      where: { quizId },
      include: {
        user: {
          select: {
            username: true,
            id: true,
          },
        },
      },
      orderBy: {
        totalScore: "desc",
      },
      take: 100,
    });

    return NextResponse.json(scores);
  }

  // Classement global
  const globalScores = await prisma.score.groupBy({
    by: ["userId"],
    _sum: {
      totalScore: true,
    },
    orderBy: {
      _sum: {
        totalScore: "desc",
      },
    },
    take: 100,
  });

  // Enrichir avec les données utilisateur
  const enrichedScores = await Promise.all(
    globalScores.map(async (score) => {
      const user = await prisma.user.findUnique({
        where: { id: score.userId },
        select: { username: true, id: true },
      });
      return {
        user,
        totalScore: score._sum.totalScore,
      };
    })
  );

  return NextResponse.json(enrichedScores);
}
```

---

## 🛡️ Middleware de protection

```typescript
// src/middleware.ts

import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized({ req, token }) {
      // Les routes /api/* nécessitent un token
      if (req.nextUrl.pathname.startsWith("/api")) {
        return !!token;
      }
      return true;
    },
  },
});

export const config = {
  matcher: ["/dashboard/:path*", "/quiz/create", "/quiz/edit/:path*", "/api/:path*"],
};
```

---

## 🎨 Exemple de composant Quiz Player

```typescript
// src/components/quiz/QuizPlayer.tsx

"use client";

import { useState } from "react";
import { QuestionType } from "@prisma/client";

interface Answer {
  id: string;
  content: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  type: QuestionType;
  content: string;
  answers: Answer[];
}

interface QuizPlayerProps {
  quiz: {
    id: string;
    title: string;
    questions: Question[];
  };
}

export default function QuizPlayer({ quiz }: QuizPlayerProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleAnswerSelect = (questionId: string, answerId: string) => {
    const question = quiz.questions[currentQuestion];

    if (question.type === "TRUE_FALSE" || question.type === "TEXT") {
      // Une seule réponse
      setAnswers({ ...answers, [questionId]: [answerId] });
    } else {
      // QCM : réponses multiples
      const current = answers[questionId] || [];
      if (current.includes(answerId)) {
        setAnswers({
          ...answers,
          [questionId]: current.filter((id) => id !== answerId),
        });
      } else {
        setAnswers({ ...answers, [questionId]: [...current, answerId] });
      }
    }
  };

  const handleSubmit = async () => {
    const response = await fetch(`/api/quiz/${quiz.id}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

    const result = await response.json();
    setIsSubmitted(true);
    alert(`Score: ${result.score} points`);
  };

  const question = quiz.questions[currentQuestion];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{quiz.title}</h1>

      <div className="mb-4">
        Question {currentQuestion + 1} / {quiz.questions.length}
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">{question.content}</h2>

        <div className="space-y-3">
          {question.answers.map((answer) => (
            <label
              key={answer.id}
              className="flex items-center p-3 border rounded hover:bg-gray-50 cursor-pointer"
            >
              <input
                type={question.type === "MCQ" ? "checkbox" : "radio"}
                name={question.id}
                value={answer.id}
                checked={answers[question.id]?.includes(answer.id)}
                onChange={() => handleAnswerSelect(question.id, answer.id)}
                className="mr-3"
              />
              <span>{answer.content}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
          disabled={currentQuestion === 0}
          className="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
        >
          Précédent
        </button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion(currentQuestion + 1)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Suivant
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitted}
            className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
          >
            Soumettre
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 📦 Package.json

```json
{
  "name": "quiz-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "db:push": "prisma db push",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "next-auth": "^4.24.0",
    "@prisma/client": "^5.20.0",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.3.0",
    "prisma": "^5.20.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tsx": "^4.7.0"
  }
}
```

---

## 🚀 Déploiement sur Vercel

1. **Push ton code sur GitHub**
2. **Connecte Vercel à ton repo**
3. **Configure les variables d'environnement** :
   - `DATABASE_URL` (depuis Neon)
   - `NEXTAUTH_SECRET` (généré avec `openssl rand -base64 32`)
   - `NEXTAUTH_URL` (URL de production)
4. **Deploy automatiquement !**

---

## 🔒 Sécurité implémentée

✅ Hashing des mots de passe (bcrypt)
✅ Validation côté serveur (Zod)
✅ Contrainte unique userId-quizId
✅ Vérification propriétaire avant modification
✅ Protection CSRF (Next.js par défaut)
✅ Middleware d'authentification

---

## 📈 Optimisations

- **Indexes** sur les clés étrangères et colonnes de tri
- **Server Components** par défaut (Next.js 15)
- **ISR** (Incremental Static Regeneration) pour les pages publiques
- **Client Components** uniquement pour l'interactivité

---

## 🎓 Prochaines étapes

1. Clone le starter kit
2. Configure `.env.local`
3. Lance `npm install`
4. Exécute `npx prisma db push`
5. Seed la base : `npm run db:seed`
6. Démarre le dev : `npm run dev`

Besoin de plus de détails sur une partie spécifique ? 🚀
