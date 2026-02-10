// 📄 Fichier : src/app/api/quiz/[id]/submit/route.ts
// Route API pour soumettre les réponses d'un quiz

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';

interface UserAnswer {
  questionId: string;
  answerId?: string;
  freeText?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Récupérer la session utilisateur
    const session = await getServerSession();

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const quizId = params.id;
    const body = await request.json();
    const { answers } = body as { answers: UserAnswer[] };

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    // Récupérer le quiz avec les bonnes réponses
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        createdBy: {
          select: { id: true },
        },
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz non trouvé' },
        { status: 404 }
      );
    }

    // Calculer le score
    let totalScore = 0;
    let totalPoints = 0;

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers.find((a) => a.questionId === question.id);

      if (!userAnswer) {
        continue;
      }

      let isCorrect = false;

      // Vérifier selon le type de question
      if (question.type === 'TRUE_FALSE' || question.type === 'MULTIPLE_CHOICE') {
        if (userAnswer.answerId) {
          const selectedAnswer = question.answers.find(
            (a) => a.id === userAnswer.answerId
          );
          isCorrect = selectedAnswer?.isCorrect || false;
        }
      } else if (question.type === 'FREE_TEXT') {
        const correctAnswer = question.answers.find((a) => a.isCorrect);
        if (correctAnswer && userAnswer.freeText) {
          // Comparaison simple (ignorer casse et espaces)
          const userText = userAnswer.freeText.trim().toLowerCase();
          const correctText = correctAnswer.text.trim().toLowerCase();
          isCorrect = userText === correctText;
        }
      }

      if (isCorrect) {
        totalScore += question.points;
      }
    }

    // Vérifier si l'utilisateur est le créateur
    const isCreator = session.user.id === quiz.createdBy.id;

    // Enregistrer le score seulement si pas le créateur
    if (!isCreator) {
      // Chercher un score existant
      const existingScore = await prisma.score.findFirst({
        where: {
          userId: session.user.id,
          quizId: quizId,
        },
      });

      if (existingScore) {
        // Mettre à jour si meilleur score
        if (totalScore > existingScore.score) {
          await prisma.score.update({
            where: { id: existingScore.id },
            data: {
              score: totalScore,
              completedAt: new Date(),
            },
          });
        }
      } else {
        // Créer un nouveau score
        await prisma.score.create({
          data: {
            userId: session.user.id,
            quizId: quizId,
            score: totalScore,
            completedAt: new Date(),
          },
        });
      }
    }

    return NextResponse.json({
      score: totalScore,
      totalPoints: totalPoints,
      percentage: Math.round((totalScore / totalPoints) * 100),
      isCreator: isCreator,
    });
  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
