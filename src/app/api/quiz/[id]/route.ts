import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ params est une Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder à ce quiz' },
        { status: 401 }
      );
    }

    const { id: quizId } = await params;  // ✅ await params

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

    if (!quiz.isPublic && quiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: "Vous n'avez pas accès à ce quiz privé" },
        { status: 403 }
      );
    }

    const formattedQuiz = {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description || '',
      isPublic: quiz.isPublic,
      creatorId: quiz.creatorId,
      creator: {
        id: quiz.creator.id,
        username: quiz.creator.username || quiz.creator.email,
      },
      questions: quiz.questions.map((q) => {
        if (q.type === 'TEXT') {
          const correctAnswer = q.answers.find(a => a.isCorrect)?.content || q.answers[0]?.content;
          return {
            id: q.id,
            text: q.content,
            type: q.type,
            points: q.points,
            answers: [{ id: q.answers[0]?.id, text: correctAnswer, isCorrect: true }],
          };
        }
        
        return {
          id: q.id,
          text: q.content,
          type: q.type,
          points: q.points,
          answers: q.answers.map((a) => ({
            id: a.id,
            text: a.content,
            isCorrect: a.isCorrect,
          })),
        };
      }),
      bestScore: quiz.scores[0]?.totalScore ?? null,
    };

    return NextResponse.json(formattedQuiz, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ params est une Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id } = await params;  // ✅ await params
    const body = await request.json();
    const { title, description, isPublic, questions } = body;

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz non trouvé' },
        { status: 404 }
      );
    }

    if (existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.quiz.update({
        where: { id },
        data: {
          title,
          description,
          isPublic,
        },
      });

      await tx.answer.deleteMany({
        where: {
          question: {
            quizId: id,
          },
        },
      });

      await tx.question.deleteMany({
        where: {
          quizId: id,
        },
      });

      for (const q of questions) {
        await tx.question.create({
          data: {
            content: q.text,
            type: q.type,
            points: q.points,
            quizId: id,
            answers: {
              create: q.answers.map((a: any) => ({
                content: a.content,
                isCorrect: a.isCorrect,
              })),
            },
          },
        });
      }
    });

    const fullQuiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return NextResponse.json(fullQuiz);
  } catch (error) {
    console.error('Erreur PUT quiz:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }  // ✅ params est une Promise
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { id } = await params;  // ✅ await params

    const existingQuiz = await prisma.quiz.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!existingQuiz) {
      return NextResponse.json(
        { error: 'Quiz non trouvé' },
        { status: 404 }
      );
    }

    if (existingQuiz.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    await prisma.quiz.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE quiz:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}