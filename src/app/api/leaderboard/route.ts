// src/app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId');

    if (quizId) {
      // Classement par quiz spécifique
      const scores = await prisma.score.findMany({
        where: { quizId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
            },
          },
          quiz: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          totalScore: 'desc',
        },
        take: 100,
      });

      const leaderboard = scores.map((score, index) => ({
        rank: index + 1,
        username: score.user.username,
        userId: score.user.id,
        score: score.totalScore,
        completedAt: score.completedAt,
        quizTitle: score.quiz.title,
      }));

      return NextResponse.json({
        type: 'quiz',
        quizId,
        leaderboard,
      });
    }

    // Classement global (somme de tous les scores par utilisateur)
    const aggregatedScores = await prisma.score.groupBy({
      by: ['userId'],
      _sum: {
        totalScore: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalScore: 'desc',
        },
      },
      take: 100,
    });

    // Enrichir avec les données utilisateur
    const leaderboard = await Promise.all(
      aggregatedScores.map(async (score, index) => {
        const user = await prisma.user.findUnique({
          where: { id: score.userId },
          select: {
            id: true,
            username: true,
          },
        });

        return {
          rank: index + 1,
          username: user?.username || 'Utilisateur inconnu',
          userId: score.userId,
          totalScore: score._sum.totalScore || 0,
          quizzesCompleted: score._count.id,
        };
      })
    );

    return NextResponse.json({
      type: 'global',
      leaderboard,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
