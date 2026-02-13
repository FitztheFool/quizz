import Link from 'next/link';

interface QuizCardProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    _count: {
      questions: number;
    };
    creatorId?: string;
  };
  currentUserId?: string;
  isCompleted?: boolean;
  score?: number;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function QuizCard({
  quiz,
  currentUserId,
  isCompleted = false,
  score,
  showActions = false,
  onEdit,
  onDelete,
}: QuizCardProps) {
  const isMyQuiz = quiz.creatorId === currentUserId;

  return (
    <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all relative">
      {/* Badges */}
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

      {/* Contenu */}
      <h3 className="text-xl font-bold text-gray-900 mb-3 pr-32">
        {quiz.title}
      </h3>
      <p className="text-gray-600 mb-4 text-sm line-clamp-2">
        {quiz.description || 'Aucune description'}
      </p>

      {/* Meta informations */}
      <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
        <span className="flex items-center gap-1">
          📝 {quiz._count.questions} questions
        </span>
        {score !== undefined && (
          <span className="flex items-center gap-1 text-green-600 font-semibold">
            🏆 {score} pts
          </span>
        )}
      </div>

      {/* Actions */}
      {showActions ? (
        <div className="flex gap-3">
          <button
            onClick={onEdit}
            className="flex-1 text-center py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Modifier
          </button>
          <button
            onClick={onDelete}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Supprimer
          </button>
        </div>
      ) : (
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
      )}
    </div>
  );
}
