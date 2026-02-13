'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import QuizCard from '@/components/QuizCard';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  creatorId?: string;
  creator: {
    username: string;
  };
  _count: {
    questions: number;
  };
}

interface UserScore {
  quiz: {
    id: string;
  };
  totalScore: number;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myScores, setMyScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [session]);

  const fetchData = async () => {
    try {
      // Récupérer les quiz
      const res = await fetch('/api/quiz');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }

      // Récupérer les scores de l'utilisateur si connecté
      if (session) {
        const scoresRes = await fetch('/api/user/scores');
        if (scoresRes.ok) {
          const scoresData = await scoresRes.json();
          setMyScores(scoresData);
        }
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const completedQuizIds = myScores.map((s) => s.quiz.id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl mb-4">
            Testez vos connaissances
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Jouez à des quiz, gagnez des points et grimpez dans le classement !
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600">
              {quizzes.length}
            </div>
            <div className="text-gray-600 mt-2">Quiz disponibles</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600">3</div>
            <div className="text-gray-600 mt-2">Types de questions</div>
          </div>
          <div className="card text-center">
            <div className="text-4xl font-bold text-primary-600">∞</div>
            <div className="text-gray-600 mt-2">Parties illimitées</div>
          </div>
        </div>

        {/* Quiz List */}
        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900">Quiz disponibles</h3>
          <Link href="/leaderboard" className="text-primary-600 hover:text-primary-700">
            Voir le classement →
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Chargement des quiz...</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600 text-lg">
              Aucun quiz disponible pour le moment.
            </p>
            <p className="text-gray-500 mt-2">
              Connectez-vous pour créer le premier !
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => {
              const isCompleted = completedQuizIds.includes(quiz.id);
              const score = myScores.find((s) => s.quiz.id === quiz.id);

              return (
                <QuizCard
                  key={quiz.id}
                  quiz={quiz}
                  currentUserId={session?.user?.id}
                  isCompleted={isCompleted}
                  score={score?.totalScore}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white mt-16 border-t">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500">
            <p>Quiz App - Testez vos connaissances et défiez vos amis</p>
            <p className="mt-2 text-sm">
              Propulsé par Next.js, Prisma et PostgreSQL
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}