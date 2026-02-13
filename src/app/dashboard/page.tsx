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
  creatorId?: string;
}

interface UserScore {
  quiz: {
    id: string;
    title: string;
  };
  totalScore: number;
  completedAt: string;
}

type TabType = 'available' | 'my-quizzes' | 'scores';

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myQuizzes, setMyQuizzes] = useState<Quiz[]>([]);
  const [myScores, setMyScores] = useState<UserScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('available');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=' + encodeURIComponent('/dashboard'));
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      // Récupérer tous les quiz disponibles
      const quizzesRes = await fetch('/api/quiz');
      if (quizzesRes.ok) {
        const quizzesData = await quizzesRes.json();
        setQuizzes(quizzesData);
        
        // Filtrer les quiz créés par l'utilisateur
        const userQuizzes = quizzesData.filter(
          (quiz: Quiz) => quiz.creatorId === session?.user?.id
        );
        setMyQuizzes(userQuizzes);
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

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce quiz ?')) {
      return;
    }

    try {
      const res = await fetch(`/api/quiz/${quizId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setMyQuizzes(myQuizzes.filter((q) => q.id !== quizId));
        setQuizzes(quizzes.filter((q) => q.id !== quizId));
      } else {
        alert('Erreur lors de la suppression du quiz');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la suppression du quiz');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600 text-lg font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalScore = myScores.reduce((sum, score) => sum + score.totalScore, 0);
  const completedQuizIds = myScores.map((s) => s.quiz.id);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header avec profil */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Plateforme de Quiz
              </h1>
              <p className="text-gray-600 text-lg">
                Bienvenue, <span className="font-semibold">{session.user?.name || session.user?.email}</span>
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
            >
              Se déconnecter
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Score Total</div>
              <div className="text-4xl font-bold">{totalScore}</div>
              <div className="text-xs opacity-80 mt-1">points gagnés</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Quiz Complétés</div>
              <div className="text-4xl font-bold">{myScores.length}</div>
              <div className="text-xs opacity-80 mt-1">sur {quizzes.length} disponibles</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg">
              <div className="text-sm opacity-90 mb-2">Mes Quiz Créés</div>
              <div className="text-4xl font-bold">{myQuizzes.length}</div>
              <div className="text-xs opacity-80 mt-1">quiz personnalisés</div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="mt-8 border-b-2 border-gray-200">
            <div className="flex gap-6">
              <button
                onClick={() => setActiveTab('available')}
                className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${
                  activeTab === 'available'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Quiz disponibles
              </button>
              <button
                onClick={() => setActiveTab('my-quizzes')}
                className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${
                  activeTab === 'my-quizzes'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mes quiz
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`pb-4 px-2 font-semibold text-base transition-colors border-b-4 ${
                  activeTab === 'scores'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Mes scores
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content: Quiz Disponibles */}
        {activeTab === 'available' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Quiz disponibles</h2>
            </div>

            {quizzes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun quiz disponible</p>
                <p className="text-gray-500">Les quiz apparaîtront ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {quizzes.map((quiz) => {
                  const isCompleted = completedQuizIds.includes(quiz.id);
                  const score = myScores.find((s) => s.quiz.id === quiz.id);
                  const isMyQuiz = quiz.creatorId === session?.user?.id;

                  return (
                    <div
                      key={quiz.id}
                      className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all relative"
                    >
                      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end">
                        {isMyQuiz && (
                          <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            👤 Créé par moi
                          </span>
                        )}
                        {isCompleted && (
                          <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            ✓ Complété
                          </span>
                        )}
                      </div>

                      <h3 className="text-xl font-bold text-gray-900 mb-3 pr-32">
                        {quiz.title}
                      </h3>
                      <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                        {quiz.description || 'Aucune description'}
                      </p>

                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          📝 {quiz._count.questions} questions
                        </span>
                        {score && (
                          <span className="flex items-center gap-1 text-green-600 font-semibold">
                            🏆 {score.totalScore} pts
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/quiz/${quiz.id}`}
                        className={`block w-full text-center py-3 rounded-lg font-semibold transition-all shadow-md hover:shadow-lg ${
                          isCompleted
                            ? 'bg-green-500 hover:bg-green-600 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isCompleted ? 'Rejouer' : 'Jouer'}
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Mes Quiz */}
        {activeTab === 'my-quizzes' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Mes quiz</h2>
              <Link
                href="/quiz/create"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span className="text-xl">+</span> Créer un quiz
              </Link>
            </div>

            {myQuizzes.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun quiz créé</p>
                <p className="text-gray-500 mb-6">Créez votre premier quiz personnalisé</p>
                <Link
                  href="/quiz/create"
                  className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                >
                  Créer un quiz
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myQuizzes.map((quiz) => (
                  <div
                    key={quiz.id}
                    className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all"
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {quiz.title}
                    </h3>
                    <p className="text-gray-600 mb-4 text-sm line-clamp-2">
                      {quiz.description || 'Aucune description'}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        📝 {quiz._count.questions} questions
                      </span>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/quiz/${quiz.id}/edit`}
                        className="flex-1 text-center py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        Modifier
                      </Link>
                      <button
                        onClick={() => handleDeleteQuiz(quiz.id)}
                        className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
                      >
                        Supprimer
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Mes Scores */}
        {activeTab === 'scores' && (
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mes scores</h2>

            {myScores.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-600 text-lg mb-2">Aucun score enregistré</p>
                <p className="text-gray-500">Complétez des quiz pour voir vos scores ici</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myScores.map((score, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="flex-1">
                      <h4 className="text-lg font-bold text-gray-900 mb-1">
                        {score.quiz.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        Complété le {new Date(score.completedAt).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600">
                          {score.totalScore}
                        </div>
                        <div className="text-xs text-gray-500">points</div>
                      </div>

                      <Link
                        href={`/quiz/${score.quiz.id}`}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                      >
                        Rejouer →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
