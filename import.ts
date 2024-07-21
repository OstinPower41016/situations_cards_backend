const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({});
const fs = require('fs');

async function loadAnswers() {
  // Чтение данных из файла
  const data = fs.readFileSync(
    '/Users/ostin/Documents/cards_no_numbers.json',
    'utf8',
  );
  const answers = JSON.parse(data);

  // Добавление каждого ответа в базу данных
  for (const answer of answers) {
    await prisma.answer.create({
      data: {
        description: answer.description,
      },
    });
  }
}

loadAnswers()
  .catch((e) => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
