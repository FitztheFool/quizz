'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import QuizForm from '@/components/QuizForm';

export default function EditQuizPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const quizId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    if (status === 'authenticated' && quizId) {
      fetchQuiz();
    }
  }, [status, quizId]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quiz/${quizId}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || 'Quiz non trouvé');
      }

      const data = await res.json();

      // 🔍 DEBUG - Afficher les IDs
    console.log('Quiz creatorId:', data.creatorId, typeof data.creatorId);
    console.log('Session user id:', session?.user?.id, typeof session?.user?.id);
    console.log('Session complète:', session);
    console.log('Are equal?', data.creatorId === session?.user?.id);
      
      // Vérifier que l'utilisateur est bien le créateur
      if (data.creatorId !== session?.user?.id) {
        setError('Vous n\'êtes pas autorisé à modifier ce quiz');
        setTimeout(() => router.push('/dashboard'), 2000);
        return;
      }

      setQuizData(data);
    } catch (error: any) {
      console.error('Erreur lors du chargement:', error);
      setError(error.message || 'Erreur lors du chargement du quiz');
      setTimeout(() => router.push('/dashboard'), 2000);
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-2">Erreur</h2>
          <p className="text-gray-700">{error}</p>
          <p className="text-sm text-gray-500 mt-4">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  if (!quizData) {
    return null;
  }

  return <QuizForm mode="edit" initialData={quizData} />;
}
