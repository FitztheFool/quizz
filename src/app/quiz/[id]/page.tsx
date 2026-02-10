'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Answer {
  id: string;
  text: string;
}

interface Question {
  id: string;
  text: string;
  type: 'TRUE_FALSE' | 'MCQ' | 'TEXT';
  points: number;
  answers?: Answer[];
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  createdBy: {
    id: string;
    name: string;
  };
  questions: Question[];
}

interface UserAnswer {
  questionId: string;
  answerId?: string;
  freeText?: string;
}

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const quizId = params?.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [freeTextAnswer, setFreeTextAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);

  // Vérifier l'authentification
useEffect(() => {
  if (!quizId) return;
  if (status === 'loading') return;
  fetchQuiz();
}, [quizId, status]);

  useEffect(() => {
    if (quizId && status === 'authenticated') {
      fetchQuiz();
    }
  }, [quizId, status]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quiz/${quizId}`);
      
      if (response.status === 401) {
        // Non authentifié
        router.push(`/auth/login?callbackUrl=/quiz/${quizId}`);
        return;
      }

      if (response.status === 403) {
        setError('Vous n\'avez pas accès à ce quiz privé');
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Erreur lors du chargement du quiz');
      }

      const data = await response.json();
      setQuiz(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (answerId: string) => {
    setSelectedAnswer(answerId);
  };

  const handleNextQuestion = () => {
    if (!quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const answer: UserAnswer = {
      questionId: currentQuestion.id,
    };

    if (currentQuestion.type === 'TEXT') {
      answer.freeText = freeTextAnswer;
    } else {
      answer.answerId = selectedAnswer;
    }

    const newAnswers = [...userAnswers, answer];
    setUserAnswers(newAnswers);

    if (currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer('');
      setFreeTextAnswer('');
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (answers: UserAnswer[]) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/quiz/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la soumission du quiz');
      }

      const result = await response.json();
      setScore(result.score);
      setTotalPoints(result.totalPoints);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setCurrentQuestionIndex(0);
    setUserAnswers([]);
    setSelectedAnswer('');
    setFreeTextAnswer('');
    setScore(null);
    setTotalPoints(null);
  };

  // Loading authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Vérification de l'authentification...</p>
          </div>
        </div>
      </div>
    );
  }

  // Loading quiz
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

        <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 80px)' }}>
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg">Chargement du quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

        <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Erreur</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-block"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return null;
  }

  // Results screen
  if (score !== null && totalPoints !== null) {
    const percentage = Math.round((score / totalPoints) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="text-center">
              <div className="text-6xl mb-4">
                {percentage >= 80 ? '🏆' : percentage >= 60 ? '👍' : '📚'}
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Quiz terminé !</h2>
              <p className="text-xl text-gray-600 mb-6">{quiz.title}</p>
              
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg p-6 mb-6">
                <p className="text-5xl font-bold mb-2">{score}/{totalPoints}</p>
                <p className="text-xl">{percentage}%</p>
              </div>

              <div className="flex gap-4 justify-center flex-wrap">
                <button
                  onClick={handleRestart}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Rejouer
                </button>
                <Link
                  href="/leaderboard"
                  className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Voir les classements
                </Link>
                <Link
                  href="/"
                  className="bg-white text-gray-700 px-6 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Retour à l'accueil
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Quiz playing screen
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const canProceed = currentQuestion.type === 'TEXT' 
    ? freeTextAnswer.trim().length > 0 
    : selectedAnswer !== '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Quiz Info */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{quiz.title}</h1>
          <p className="text-gray-600 mb-4">{quiz.description}</p>
          <p className="text-sm text-gray-500">
            Par {quiz.createdBy.name}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Question {currentQuestionIndex + 1} sur {quiz.questions.length}
            </span>
            <span className="text-sm font-medium text-blue-600">
              {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">
            {currentQuestion.text}
          </h2>

          {/* TRUE_FALSE */}
          {currentQuestion.type === 'TRUE_FALSE' && currentQuestion.answers && (
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    selectedAnswer === answer.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-800">{answer.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* MCQ */}
          {currentQuestion.type === 'MCQ' && currentQuestion.answers && (
            <div className="space-y-3">
              {currentQuestion.answers.map((answer) => (
                <button
                  key={answer.id}
                  onClick={() => handleAnswerSelect(answer.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    selectedAnswer === answer.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-medium text-gray-800">{answer.text}</span>
                </button>
              ))}
            </div>
          )}

          {/* TEXT */}
          {currentQuestion.type === 'TEXT' && (
            <div>
              <textarea
                value={freeTextAnswer}
                onChange={(e) => setFreeTextAnswer(e.target.value)}
                placeholder="Saisissez votre réponse..."
                className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-600 focus:outline-none min-h-32 resize-none"
              />
              <p className="text-sm text-gray-500 mt-2">
                Cette question vaut {currentQuestion.points} points
              </p>
            </div>
          )}
        </div>

        {/* Navigation Button */}
        <div className="flex justify-end">
          <button
            onClick={handleNextQuestion}
            disabled={!canProceed || isSubmitting}
            className={`px-8 py-3 rounded-lg font-medium transition-all ${
              canProceed && !isSubmitting
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting
              ? 'Envoi...'
              : currentQuestionIndex < quiz.questions.length - 1
              ? 'Question suivante →'
              : 'Terminer le quiz'}
          </button>
        </div>
      </div>
    </div>
  );
}