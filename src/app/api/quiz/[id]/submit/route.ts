import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface UserAnswer {
  questionId: string;
  answerId?: string;      // TRUE_FALSE (ou MCQ single si jamais)
  answerIds?: string[];   // MCQ multi
  freeText?: string;      // TEXT
}

type QuestionResult = {
  questionId: string;
  questionText: string;
  type: 'TRUE_FALSE' | 'MCQ' | 'TEXT';
  points: number;
  isCorrect: boolean;

  correctAnswerTexts: string[];
  userAnswerTexts: string[];

  // utile pour TEXT
  userFreeText?: string;
};

function normalizeIds(ids: string[]) {
  return Array.from(new Set(ids)).sort();
}

function answerLabel(a: any) {
  // selon ton modèle prisma, ça peut être "text" ou "content"
  return String(a?.text ?? a?.content ?? '').trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const quizId = params.id;
    const body = await request.json();
    const answers = (body?.answers ?? []) as UserAnswer[];

    if (!Array.isArray(answers)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        creator: { select: { id: true } },
        questions: { include: { answers: true } },
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz non trouvé' }, { status: 404 });
    }

    let totalScore = 0;
    let totalPoints = 0;
    const details: QuestionResult[] = [];

    for (const question of quiz.questions) {
      totalPoints += question.points;

      const userAnswer = answers.find((a) => a.questionId === question.id);

      const correctAnswers = question.answers.filter((a) => a.isCorrect);
      const correctIds = normalizeIds(correctAnswers.map((a) => a.id));
      const correctTexts = correctAnswers.map((a) => answerLabel(a)).filter(Boolean);

      let isCorrect = false;
      let userTexts: string[] = [];

      if (question.type === 'TRUE_FALSE') {
        if (userAnswer?.answerId) {
          const selected = question.answers.find((a) => a.id === userAnswer.answerId);
          if (selected) {
            userTexts = [answerLabel(selected)].filter(Boolean);
            isCorrect = !!selected.isCorrect;
          }
        }
      }

      if (question.type === 'MCQ') {
        const rawUserIds =
          userAnswer?.answerIds?.length
            ? userAnswer.answerIds
            : userAnswer?.answerId
            ? [userAnswer.answerId]
            : [];

        const userIds = normalizeIds(rawUserIds);

        userTexts = userIds
          .map((id) => question.answers.find((a) => a.id === id))
          .filter(Boolean)
          .map((a) => answerLabel(a))
          .filter(Boolean);

        isCorrect =
          correctIds.length === userIds.length &&
          correctIds.every((id, i) => id === userIds[i]);
      }

      if (question.type === 'TEXT') {
        const correct = correctAnswers[0];
        if (correct && userAnswer?.freeText) {
          const userText = userAnswer.freeText.trim().toLowerCase();
          const correctText = answerLabel(correct).trim().toLowerCase();
          isCorrect = userText.length > 0 && userText === correctText;
        }
      }

      if (isCorrect) totalScore += question.points;

      details.push({
        questionId: question.id,
        questionText: question.content,
        type: question.type as any,
        points: question.points,
        isCorrect,
        correctAnswerTexts: correctTexts,
        userAnswerTexts: userTexts,
        userFreeText: userAnswer?.freeText,
      });
    }

    // (optionnel) règle "pas de gain si créateur" -> tu peux la remettre ici si tu veux
    // const isCreator = session.user.id === quiz.creator.id;

    return NextResponse.json({
      score: totalScore,
      totalPoints,
      percentage: totalPoints > 0 ? Math.round((totalScore / totalPoints) * 100) : 0,
      details,
    });
  } catch (error) {
    console.error('Erreur lors de la soumission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}