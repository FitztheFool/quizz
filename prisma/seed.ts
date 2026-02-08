import { PrismaClient, QuestionType } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seed...');

  // Nettoyer la base
  await prisma.score.deleteMany();
  await prisma.answer.deleteMany();
  await prisma.question.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.user.deleteMany();

  // Créer des utilisateurs
  const user1 = await prisma.user.create({
    data: {
      username: 'alice',
      email: 'alice@example.com',
      passwordHash: await hash('password123', 10),
    },
  });

  const user2 = await prisma.user.create({
    data: {
      username: 'bob',
      email: 'bob@example.com',
      passwordHash: await hash('password123', 10),
    },
  });

  console.log('✅ Utilisateurs créés');

  // Quiz 1: Culture Générale
  const quiz1 = await prisma.quiz.create({
    data: {
      title: 'Quiz de Culture Générale',
      description: 'Testez vos connaissances générales !',
      creatorId: user1.id,
      isPublic: true,
      questions: {
        create: [
          // Question TRUE_FALSE
          {
            type: QuestionType.TRUE_FALSE,
            content: 'La Tour Eiffel mesure 330 mètres de hauteur.',
            answers: {
              create: [
                { content: 'Vrai', isCorrect: true },
                { content: 'Faux', isCorrect: false },
              ],
            },
          },
          // Question MCQ
          {
            type: QuestionType.MCQ,
            content: 'Quels sont les pays frontaliers de la France ?',
            answers: {
              create: [
                { content: 'Espagne', isCorrect: true },
                { content: 'Allemagne', isCorrect: true },
                { content: 'Pologne', isCorrect: false },
                { content: 'Italie', isCorrect: true },
              ],
            },
          },
          // Question TEXT
          {
            type: QuestionType.TEXT,
            content: 'Quelle est la capitale de l\'Australie ?',
            answers: {
              create: [
                { content: 'Canberra', isCorrect: true },
                { content: 'Sydney', isCorrect: false },
                { content: 'Melbourne', isCorrect: false },
              ],
            },
          },
        ],
      },
    },
  });

  // Quiz 2: JavaScript
  const quiz2 = await prisma.quiz.create({
    data: {
      title: 'Quiz JavaScript',
      description: 'Connaissances en JavaScript moderne',
      creatorId: user2.id,
      isPublic: true,
      questions: {
        create: [
          {
            type: QuestionType.TRUE_FALSE,
            content: 'JavaScript est un langage typé statiquement.',
            answers: {
              create: [
                { content: 'Vrai', isCorrect: false },
                { content: 'Faux', isCorrect: true },
              ],
            },
          },
          {
            type: QuestionType.MCQ,
            content: 'Quelles sont des méthodes de tableau JavaScript ?',
            answers: {
              create: [
                { content: 'map()', isCorrect: true },
                { content: 'filter()', isCorrect: true },
                { content: 'query()', isCorrect: false },
                { content: 'reduce()', isCorrect: true },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Quiz créés');

  // Créer quelques scores pour le classement
  await prisma.score.create({
    data: {
      userId: user2.id,
      quizId: quiz1.id,
      totalScore: 9, // 1 + 3 + 5
    },
  });

  await prisma.score.create({
    data: {
      userId: user1.id,
      quizId: quiz2.id,
      totalScore: 4, // 1 + 3
    },
  });

  console.log('✅ Scores créés');
  console.log('🎉 Seed terminé avec succès !');
  console.log('\n📊 Données créées:');
  console.log(`- 2 utilisateurs (alice/bob, mot de passe: password123)`);
  console.log(`- 2 quiz`);
  console.log(`- 5 questions`);
  console.log(`- 2 scores`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
