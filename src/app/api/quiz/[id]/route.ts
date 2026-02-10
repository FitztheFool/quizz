// 📄 Fichier : src/app/api/quiz/[id]/route.ts
// Route API pour récupérer un quiz - VERSION CORRIGÉE

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quizId = params.id;

    // Récupérer le quiz avec ses questions et réponses
    const quiz = await prisma.quiz.findUnique({
      where: {
        id: quizId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        questions: {
          include: {
            answers: {
              select: {
                id: true,
                text: true,
                // On ne renvoie PAS isCorrect pour éviter la triche
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
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

    // Formater les données pour le client
    const formattedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      createdBy: {
        id: quiz.creator.id,
        name: quiz.creator.name || quiz.creator.email,
      },
      questions: quiz.questions.map((question) => ({
        id: question.id,
        text: question.text,
        type: question.type,
        points: question.points,
        // Inclure les réponses seulement pour les questions à choix
        answers: question.type !== 'FREE_TEXT' ? question.answers : undefined,
      })),
    };

    return NextResponse.json(formattedQuiz);
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
