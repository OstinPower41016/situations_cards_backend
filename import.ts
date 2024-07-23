import { Column, DataSource, Entity } from 'typeorm';
const fs = require('fs');
import { CustomBaseEntity } from 'src/entities/base.entity';
import { AnswerEntity } from 'src/entities/answer.entity';
import { join } from 'path';
import { QuestionEntity } from 'src/entities/question.entity';

const dataSource = new DataSource({
  type: 'postgres',

  host: '127.0.0.1',
  port: 5432,
  username: 'ostin',
  password: '1234',
  database: 'situation_cards',
  entities: [join(__dirname, 'src/entities/*.entity.js')],
  // migrations: ['dist/db/migrations/*.js'],
});

async function loadAnswers() {
  await dataSource.initialize();

  // Чтение данных из файла
  const data = fs.readFileSync(
    '/Users/ostin/Documents/questions_no_numbers.json',
    'utf8',
  );
  const answers = JSON.parse(data);

  // Добавление каждого ответа в базу данных
  for (const answer of answers) {
    const answerEntity = new QuestionEntity();
    answerEntity.description = answer.description;
    await dataSource.manager.save(answerEntity);
  }

  await dataSource.destroy();
}

loadAnswers().catch((error) => {
  console.error('Failed to load answers:', error);
});
