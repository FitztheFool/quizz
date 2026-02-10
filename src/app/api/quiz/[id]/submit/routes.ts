import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const quizId = params.id;
    const body = await request.json();
    const { answers } = body as { answers: UserAnswer[] };

    if (!quizId || !answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    // Récupérer le quiz avec toutes ses questions et réponses
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

    // Vérifier si l'utilisateur est le créateur du quiz
    const isCreator = session.user.id === quiz.createdBy.id;

    // Calculer le score
    let totalScore = 0;
    let totalPoints = 0;
    const results = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;
      const userAnswer = answers.find((a) => a.questionId === question.id);

      if (!userAnswer) {
        results.push({
          questionId: question.id,
          correct: false,
          points: 0,
        });
        continue;
      }

      let isCorrect = false;

      // Vérifier la réponse selon le type de question
      if (question.type === 'TRUE_FALSE' || question.type === 'MULTIPLE_CHOICE') {
        if (userAnswer.answerId) {
          const selectedAnswer = question.answers.find(
            (a) => a.id === userAnswer.answerId
          );
          isCorrect = selectedAnswer?.isCorrect || false;
        }
      } else if (question.type === 'FREE_TEXT') {
        // Pour les questions de texte libre, on compare la réponse
        // (en ignorant la casse et les espaces superflus)
        const correctAnswer = question.answers.find((a) => a.isCorrect);
        if (correctAnswer && userAnswer.freeText) {
          const normalizedUserAnswer = userAnswer.freeText
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
          const normalizedCorrectAnswer = correctAnswer.text
            .trim()
            .toLowerCase()
            .replace(/\s+/g, ' ');
          isCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
        }
      }

      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      results.push({
        questionId: question.id,
        correct: isCorrect,
        points: pointsEarned,
      });
    }

    // Enregistrer le résultat seulement si l'utilisateur n'est PAS le créateur
    if (!isCreator) {
      // Vérifier si l'utilisateur a déjà un score pour ce quiz
      const existingScore = await prisma.score.findFirst({
        where: {
          userId: session.user.id,
          quizId: quizId,
        },
      });

      if (existingScore) {
        // Mettre à jour le score seulement si le nouveau score est meilleur
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
      results: results,
      isCreator: isCreator,
      message: isCreator
        ? 'Score non comptabilisé (vous êtes le créateur)'
        : 'Score enregistré !',
    });
  } catch (error) {
    console.error('Erreur lors de la soumission du quiz:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la soumission du quiz' },
      { status: 500 }
    );
  }
}