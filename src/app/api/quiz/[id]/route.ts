import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } } // ⬅️ correction ici
) {
  try {
    // 1️⃣ Vérifier l'authentification
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à ce quiz' },
        { status: 401 }
      );
    }

    const quizId = params.id;

    // 2️⃣ Récupérer le quiz
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        questions: {
          include: {
            answers: {
              select: {
                id: true,
                content: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        scores: {
          select: {
            totalScore: true,
          },
          orderBy: {
            totalScore: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!quiz) {
      return NextResponse.json(
        { error: 'Quiz non trouvé' },
        { status: 404 }
      );
    }

    // 3️⃣ Vérifier l’accès (quiz privé)
    if (!quiz.isPublic && quiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à ce quiz privé" },
        { status: 403 }
      );
    }

    // 4️⃣ Formatter la réponse
    const formattedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      createdBy: {
        id: quiz.creator.id,
        name: quiz.creator.username || quiz.creator.email,
      },
      questions: quiz.questions.map((q) => ({
        id: q.id,
        text: q.content,
        type: q.type,
        points: q.points,
        answers:
          q.type !== 'TEXT'
            ? q.answers.map((a) => ({
                id: a.id,
                text: a.content,
              }))
            : undefined,
      })),
      bestScore: quiz.scores[0]?.totalScore ?? null,
    };

    return NextResponse.json(formattedQuiz, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 } // ✅ conservé
    );
  }
}
