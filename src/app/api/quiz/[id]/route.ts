import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
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
                isCorrect: true,
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

    // 3️⃣ Vérifier l'accès (quiz privé)
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
      questions: quiz.questions.map((q) => {
        // 🔍 DEBUG pour les questions TEXT
        if (q.type === 'TEXT') {
          console.log('========================================');
          console.log('🔍 TYPE:', q.type);
          console.log('🔍 QUESTION (q.content):', q.content);
          console.log('🔍 NOMBRE D\'ANSWERS:', q.answers.length);
          console.log('🔍 TOUS LES ANSWERS:', JSON.stringify(q.answers, null, 2));
          
          const correctAnswer = q.answers.find(a => a.isCorrect)?.content || q.answers[0]?.content;
          console.log('🔍 RÉPONSE CORRECTE EXTRAITE:', correctAnswer);
          console.log('========================================');
          
          return {
            id: q.id,
            text: q.content,
            type: q.type,
            points: q.points,
            correctAnswerText: correctAnswer,
            answers: undefined,
          };
        }
        
        // Pour TRUE_FALSE et MCQ
        return {
          id: q.id,
          text: q.content,
          type: q.type,
          points: q.points,
          correctAnswerText: undefined,
          answers: q.answers.map((a) => ({
            id: a.id,
            text: a.content,
            isCorrect: a.isCorrect,
          })),
        };
      }),
      bestScore: quiz.scores[0]?.totalScore ?? null,
    };

    console.log('📤 QUIZ FORMATÉ ENVOYÉ AU CLIENT:');
    console.log(JSON.stringify(formattedQuiz, null, 2));

    return NextResponse.json(formattedQuiz, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);

    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
