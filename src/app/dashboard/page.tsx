'use client';

import { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  _count: {
    questions: number;
  };
}

interface UserScore {
  quiz: {
    id: string;
    title: string;
  };
  totalScore: number;
  completedAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myScores, setMyScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Récupérer les quiz disponibles
      const quizzesRes = await fetch('/api/quiz');
      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData);
      }

      // Récupérer les scores de l'utilisateur
      const scoresRes = await fetch('/api/user/scores');
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        setMyScores(scoresData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalScore = myScores.reduce((sum, score) => sum + score.totalScore, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
            Tableau de bord
          </h1>
          <p className="text-xl text-gray-600">
            Bienvenue dans votre espace personnel
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Score Total</div>
            <div className="text-3xl font-bold text-primary-600">{totalScore}</div>
            <div className="text-xs text-gray-500 mt-1">points gagnés</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Quiz Complétés</div>
            <div className="text-3xl font-bold text-primary-600">{myScores.length}</div>
            <div className="text-xs text-gray-500 mt-1">sur {quizzes.length} disponibles</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600 mb-1">Classement</div>
            <div className="text-3xl font-bold text-primary-600">
              <Link href="/leaderboard" className="hover:underline">
                Voir →
              </Link>
            </div>
            <div className="text-xs text-gray-500 mt-1">classement global</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button className="border-b-2 border-primary-600 py-4 px-1 text-sm font-medium text-primary-600">
              Quiz disponibles
            </button>
            <button className="border-transparent py-4 px-1 text-sm font-medium text-gray-500 hover:text-gray-700 hover:border-gray-300">
              Mes scores
            </button>
          </nav>
        </div>

        {/* Quiz List */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Quiz disponibles</h2>
            <Link href="/quiz/create" className="btn-primary">
              + Créer un quiz
            </Link>
          </div>

          {quizzes.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-600 text-lg">Aucun quiz disponible.</p>
              <p className="text-gray-500 mt-2">Créez le premier !</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => {
                const completed = myScores.find((s) => s.quiz.id === quiz.id);
                
                return (
                  <div key={quiz.id} className="card relative">
                    {completed && (
                      <div className="absolute top-4 right-4">
                        <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                          ✓ Complété
                        </span>
                      </div>
                    )}
                    
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {quiz.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {quiz.description || 'Aucune description'}
                    </p>
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                      <span>📝 {quiz._count.questions} questions</span>
                      {completed && (
                        <span className="ml-4">🏆 {completed.totalScore} pts</span>
                      )}
                    </div>
                    <Link
                      href={`/quiz/${quiz.id}`}
                      className="btn-primary w-full text-center"
                    >
                      {completed ? 'Rejouer' : 'Jouer'}
                    </Link>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* My Scores Section */}
        {myScores.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Mes derniers scores</h2>
            <div className="card overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Quiz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myScores.map((score, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {score.quiz.title}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-primary-600">
                          {score.totalScore} pts
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-500">
                          {new Date(score.completedAt).toLocaleDateString('fr-FR')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/quiz/${score.quiz.id}`}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Rejouer →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
