import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


export async function GET() {
  try {
    const quizzes = await prisma.quiz.findMany({
      where: {
        isPublic: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        creatorId: true, // ← Champ ajouté pour identifier le créateur
        creator: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            questions: true,
          },
        },
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(quizzes);
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, isPublic, questions } = body;

    // Créer le quiz avec ses questions et réponses
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description: description || '',
        isPublic: isPublic ?? true,
        creatorId: session.user.id,
        questions: {
          create: questions.map((q: any) => ({
            content: q.text,
            type: q.type,
            points: q.points,
            answers: {
              create: q.answers.map((a: any) => ({
                content: a.content,
                isCorrect: a.isCorrect,
              })),
            },
          })),
        },
      },
      include: {
        questions: {
          include: {
            answers: true,
          },
        },
      },
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Erreur POST quiz:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}