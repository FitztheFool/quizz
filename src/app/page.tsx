'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  creator: {
    username: string;
  };
  _count: {
    questions: number;
  };
}

export default function HomePage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quiz');
      if (res.ok) {
        const data = await res.json();
        setQuizzes(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              🎯 Quiz App
            </h1>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="btn-primary"
              >
                S'inscrire
              </Link>
            </div>
          </div>
        </div>
      </header>

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
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="card hover:shadow-lg transition-shadow">
                <h4 className="text-xl font-semibold text-gray-900 mb-2">
                  {quiz.title}
                </h4>
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {quiz.description || 'Aucune description'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>👤 {quiz.creator.username}</span>
                  <span>📝 {quiz._count.questions} questions</span>
                </div>
                <Link
                  href={`/quiz/${quiz.id}`}
                  className="btn-primary w-full text-center"
                >
                  Jouer
                </Link>
              </div>
            ))}
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
