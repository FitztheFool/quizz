'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

type QuestionType = 'TRUE_FALSE' | 'MCQ' | 'TEXT';

type AnswerForm = {
  id?: string;
  tempId?: string;  // ✅ Ajouté
  text: string;
  isCorrect: boolean;
};

type QuestionForm = {
  id?: string;
  tempId?: string;  // ✅ Ajouté
  text: string;
  type: QuestionType;
  points: number;
  answers: AnswerForm[];
};

type QuizFormState = {
  id?: string;
  title: string;
  description: string;
  isPublic: boolean;
  questions: QuestionForm[];
};

// ✅ Générateur d'ID stable (pas de Math.random)
let idCounter = 0;
const generateId = () => `temp_${Date.now()}_${idCounter++}`;

function defaultTrueFalseAnswers(): AnswerForm[] {
  return [
    { tempId: generateId(), text: 'Vrai', isCorrect: true },
    { tempId: generateId(), text: 'Faux', isCorrect: false },
  ];
}

function defaultMcqAnswers(): AnswerForm[] {
  return [
    { tempId: generateId(), text: 'Réponse A', isCorrect: false },
    { tempId: generateId(), text: 'Réponse B', isCorrect: false },
  ];
}

function defaultTextAnswer(): AnswerForm[] {
  return [{ tempId: generateId(), text: '', isCorrect: true }];
}

function normalizeQuestion(q: QuestionForm): QuestionForm {
  // Garantir des structures cohérentes selon le type
  if (q.type === 'TRUE_FALSE') {
    const a = q.answers?.length ? q.answers : defaultTrueFalseAnswers();
    const two = [
      { ...a[0], text: a[0]?.text ?? 'Vrai' },
      { ...a[1], text: a[1]?.text ?? 'Faux' },
    ].slice(0, 2);

    const hasTrue = two.some((x) => x.isCorrect);
    if (!hasTrue) two[0].isCorrect = true;
    if (two.filter((x) => x.isCorrect).length > 1) {
      two[0].isCorrect = true;
      two[1].isCorrect = false;
    }

    return { ...q, answers: two };
  }

  if (q.type === 'TEXT') {
    const a = q.answers?.length ? q.answers : defaultTextAnswer();
    const one = [{ ...a[0], isCorrect: true }];
    return { ...q, answers: one };
  }

  // MCQ
  const a = q.answers?.length ? q.answers : defaultMcqAnswers();
  return { ...q, answers: a };
}

export default function QuizForm({
  mode,
  initialData,
}: {
  mode: 'create' | 'edit';
  initialData?: Partial<QuizFormState>;
}) {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<QuizFormState>(() => {
    const base: QuizFormState = {
      id: initialData?.id,
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      isPublic: initialData?.isPublic ?? true,
      questions:
        initialData?.questions?.length
          ? (initialData.questions as QuestionForm[]).map(q => ({
              ...normalizeQuestion(q),
              tempId: q.id || generateId()  // ✅ Utiliser id ou générer tempId
            }))
          : [
              {
                ...normalizeQuestion({
                  text: 'Question 1',
                  type: 'MCQ',
                  points: 3,
                  answers: defaultMcqAnswers(),
                }),
                tempId: generateId()  // ✅ ID stable
              },
            ],
    };

    return base;
  });

  const totalPoints = useMemo(
    () => form.questions.reduce((sum, q) => sum + (Number(q.points) || 0), 0),
    [form.questions]
  );

  function setQuizField<K extends keyof QuizFormState>(key: K, value: QuizFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateQuestion(index: number, patch: Partial<QuestionForm>) {
    setForm((prev) => {
      const next = [...prev.questions];
      const current = next[index];
      
      // Normaliser UNIQUEMENT si on change le type
      if (patch.type && patch.type !== current.type) {
        next[index] = normalizeQuestion({ ...current, ...patch });
      } else {
        next[index] = { ...current, ...patch };
      }
      
      return { ...prev, questions: next };
    });
  }

  function addQuestion() {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          ...normalizeQuestion({
            text: `Question ${prev.questions.length + 1}`,
            type: 'MCQ',
            points: 3,
            answers: defaultMcqAnswers(),
          }),
          tempId: generateId()  // ✅ ID stable
        },
      ],
    }));
  }

  function deleteQuestion(index: number) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  }

  function addAnswer(qIndex: number) {
    setForm((prev) => {
      const next = [...prev.questions];
      const q = next[qIndex];

      if (q.type !== 'MCQ') return prev;

      next[qIndex] = {
        ...q,
        answers: [...q.answers, { tempId: generateId(), text: `Réponse ${q.answers.length + 1}`, isCorrect: false }]
      };
      return { ...prev, questions: next };
    });
  }

  function deleteAnswer(qIndex: number, aIndex: number) {
    setForm((prev) => {
      const next = [...prev.questions];
      const q = next[qIndex];
      if (q.type !== 'MCQ') return prev;
      if (q.answers.length <= 2) return prev;
      next[qIndex] = {
        ...q,
        answers: q.answers.filter((_, i) => i !== aIndex)
      };
      return { ...prev, questions: next };
    });
  }

  function toggleCorrect(qIndex: number, aIndex: number) {
    setForm((prev) => {
      const next = [...prev.questions];
      const q = next[qIndex];

      if (q.type === 'MCQ') {
        const answers = q.answers.map((a, i) => (i === aIndex ? { ...a, isCorrect: !a.isCorrect } : a));
        next[qIndex] = { ...q, answers };
      } else if (q.type === 'TRUE_FALSE') {
        const answers = q.answers.map((a, i) => ({ ...a, isCorrect: i === aIndex }));
        next[qIndex] = { ...q, answers };
      }

      return { ...prev, questions: next };
    });
  }

  function setTextExpected(qIndex: number, value: string) {
    setForm((prev) => {
      const next = [...prev.questions];
      const q = next[qIndex];
      if (q.type !== 'TEXT') return prev;
      
      const answers = [{ ...q.answers[0], text: value, isCorrect: true }];
      next[qIndex] = { ...q, answers };
      
      return { ...prev, questions: next };
    });
  }

  function validate(): string | null {
    if (!form.title.trim()) return 'Titre requis.';
    if (form.questions.length === 0) return 'Ajoute au moins une question.';

    for (const [qi, q] of form.questions.entries()) {
      if (!q.text.trim()) return `Question ${qi + 1}: texte requis.`;
      if (!q.points || q.points < 0) return `Question ${qi + 1}: points invalides.`;

      if (q.type === 'MCQ') {
        if (!q.answers || q.answers.length < 2) return `Question ${qi + 1}: minimum 2 réponses.`;
        if (q.answers.some((a) => !a.text.trim())) return `Question ${qi + 1}: une réponse est vide.`;
        if (q.answers.filter((a) => a.isCorrect).length === 0) return `Question ${qi + 1}: coche au moins une bonne réponse.`;
      }

      if (q.type === 'TRUE_FALSE') {
        if (q.answers.length !== 2) return `Question ${qi + 1}: doit avoir Vrai/Faux.`;
        if (q.answers.filter((a) => a.isCorrect).length !== 1) return `Question ${qi + 1}: coche exactement une bonne réponse.`;
      }

      if (q.type === 'TEXT') {
        const expected = q.answers?.[0]?.text ?? '';
        if (!expected.trim()) return `Question ${qi + 1}: réponse attendue requise.`;
      }
    }

    return null;
  }

  async function onSubmit() {
    const msg = validate();
    if (msg) {
      setError(msg);
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const payload = {
        title: form.title,
        description: form.description,
        isPublic: form.isPublic,
        questions: form.questions.map((q) => ({
          id: q.id,
          text: q.text,
          type: q.type,
          points: q.points,
          answers: q.answers.map((a) => ({
            id: a.id,
            content: a.text,
            isCorrect: a.isCorrect,
          })),
        })),
      };

      const res =
        mode === 'create'
          ? await fetch('/api/quiz', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch(`/api/quiz/${form.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? 'Erreur lors de l\'enregistrement');
      }

      const saved = await res.json();
      router.push(`/quiz/dashboard`);
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {mode === 'create' ? 'Créer un quiz' : 'Modifier le quiz'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">Total points : {totalPoints}</p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titre</label>
            <input
              value={form.title}
              onChange={(e) => setQuizField('title', e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:border-blue-600"
              placeholder="Titre du quiz"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setQuizField('description', e.target.value)}
              className="w-full border rounded-lg p-3 focus:outline-none focus:border-blue-600 min-h-24"
              placeholder="Description"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isPublic}
              onChange={(e) => setQuizField('isPublic', e.target.checked)}
            />
            Quiz public
          </label>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {form.questions.map((q, qi) => (
          <div 
            key={q.id || q.tempId}  // ✅ Clé stable
            className="bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question {qi + 1}
                </label>
                <input
                  value={q.text}
                  onChange={(e) => updateQuestion(qi, { text: e.target.value })}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:border-blue-600"
                  placeholder="Texte de la question"
                />
              </div>

              <button
                onClick={() => deleteQuestion(qi)}
                className="text-red-600 hover:text-red-700 text-sm"
                type="button"
                disabled={form.questions.length === 1}
              >
                Supprimer
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={q.type}
                  onChange={(e) => {
                    const type = e.target.value as QuestionType;
                    const next: QuestionForm = normalizeQuestion({
                      ...q,
                      type,
                      answers:
                        type === 'TRUE_FALSE'
                          ? defaultTrueFalseAnswers()
                          : type === 'TEXT'
                          ? defaultTextAnswer()
                          : defaultMcqAnswers(),
                    });
                    updateQuestion(qi, next);
                  }}
                  className="w-full border rounded-lg p-3"
                >
                  <option value="MCQ">QCM (multi)</option>
                  <option value="TRUE_FALSE">Vrai / Faux</option>
                  <option value="TEXT">Texte</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                <input
                  type="number"
                  value={q.points}
                  onChange={(e) => updateQuestion(qi, { points: Number(e.target.value) })}
                  className="w-full border rounded-lg p-3"
                  min={0}
                />
              </div>

              <div className="text-sm text-gray-500 flex items-end">
                {q.type === 'MCQ'
                  ? 'Coche 1+ bonne(s) réponse(s)'
                  : q.type === 'TRUE_FALSE'
                  ? 'Choisis la bonne (radio)'
                  : 'Saisis la réponse attendue'}
              </div>
            </div>

            {/* Answers */}
            <div className="mt-6">
              {q.type === 'TEXT' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Réponse attendue
                  </label>
                  <input
                    value={q.answers?.[0]?.text ?? ''}
                    onChange={(e) => setTextExpected(qi, e.target.value)}
                    className="w-full border rounded-lg p-3 focus:outline-none focus:border-blue-600"
                    placeholder="Ex: Paris"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {q.answers.map((a, ai) => (
                    <div 
                      key={a.id || a.tempId}  // ✅ Clé stable
                      className="flex items-center gap-3"
                    >
                      <input
                        type={q.type === 'MCQ' ? 'checkbox' : 'radio'}
                        name={q.type === 'TRUE_FALSE' ? `tf_${q.id || q.tempId}` : undefined}
                        checked={a.isCorrect}
                        onChange={() => toggleCorrect(qi, ai)}
                        className="h-5 w-5"
                      />

                      <input
                        value={a.text}
                        onChange={(e) => {
                          const answers = q.answers.map((x, i) => (i === ai ? { ...x, text: e.target.value } : x));
                          updateQuestion(qi, { answers });
                        }}
                        className="flex-1 border rounded-lg p-3"
                        placeholder={`Réponse ${ai + 1}`}
                        disabled={q.type === 'TRUE_FALSE'}
                      />

                      {q.type === 'MCQ' && (
                        <button
                          type="button"
                          onClick={() => deleteAnswer(qi, ai)}
                          className="text-sm text-gray-500 hover:text-gray-700"
                          disabled={q.answers.length <= 2}
                        >
                          Suppr.
                        </button>
                      )}
                    </div>
                  ))}

                  {q.type === 'MCQ' && (
                    <button
                      type="button"
                      onClick={() => addAnswer(qi)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      + Ajouter une réponse
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={addQuestion}
          className="px-4 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
        >
          + Ajouter une question
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className={`px-6 py-3 rounded-lg font-medium ${
            saving ? 'bg-gray-300 text-gray-600' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {saving ? 'Enregistrement...' : mode === 'create' ? 'Créer le quiz' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}