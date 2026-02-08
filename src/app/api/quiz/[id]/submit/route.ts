// src/app/api/quiz/[id]/submit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;  // ✅ LIGNE CRITIQUE
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      );
    }

    const { answers } = await req.json();
    const quizId = id;  // ✅ Utilise id directement
    const userId = session.user.id;

    // 1. Récupérer le quiz avec toutes les questions et réponses
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: "Quiz introuvable" },
        { status: 404 }
      );
    }

    // 2. Vérifier si l'utilisateur est le créateur (pas de points)
    if (quiz.creatorId === userId) {
      const calculatedScore = calculateScore(quiz, answers);

      return NextResponse.json({
        message: "Les créateurs ne gagnent pas de points sur leurs propres quiz",
        score: calculatedScore,
        canReplay: true,
        isCreator: true,
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

    // 4. Calculer le score
    const totalScore = calculateScore(quiz, answers);

    if (existingScore) {
      return NextResponse.json({
        message: "Vous avez déjà complété ce quiz",
        score: totalScore,
        previousScore: existingScore.totalScore,
        canReplay: true,
        alreadyCompleted: true,
      });
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
      message: "Score enregistré avec succès !",
      score: totalScore,
      canReplay: true,
      isFirstAttempt: true,
    });
  } catch (error) {
    console.error("Erreur lors de la soumission du quiz:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// Fonction de calcul de score
function calculateScore(quiz: any, answers: Record<string, string[]>) {
  let totalScore = 0;

  for (const question of quiz.questions) {
    const userAnswerIds = answers[question.id] || [];
    const correctAnswers = question.answers.filter((a: any) => a.isCorrect);
    const correctAnswerIds = correctAnswers.map((a: any) => a.id);

    // Vérifier si la réponse est correcte
    const isCorrect =
      userAnswerIds.length === correctAnswerIds.length &&
      userAnswerIds.every((id: string) => correctAnswerIds.includes(id));

    if (isCorrect) {
      switch (question.type) {
        case 'TRUE_FALSE':
          totalScore += 1;
          break;
        case 'MCQ':
          totalScore += 3;
          break;
        case 'TEXT':
          totalScore += 5;
          break;
      }
    }
  }

  return totalScore;
}