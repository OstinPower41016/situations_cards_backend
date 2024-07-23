import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomsService } from 'src/rooms/rooms.service';
import { GameEntity } from './entities/game.entity';
import { AnswerEntity } from 'src/entities/answer.entity';
import { QuestionEntity } from 'src/entities/question.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import getQuestionsStorageCacheKey from './utils/getQuestionsStorageCacheKey';
import getAnswersStorageCacheKey from './utils/getAnswersStorageCacheKey';
import getRandomElements from './utils/getRandomElements';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserGameEntity } from 'src/user/entities/userGame.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Injectable()
export class GameService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,

    @InjectRepository(UserGameEntity)
    private readonly userGameRepository: typeof UserGameEntity,
    @InjectRepository(GameEntity)
    private readonly gameRepository: typeof GameEntity,
    @InjectRepository(AnswerEntity)
    private readonly answerRepository: typeof AnswerEntity,
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: typeof QuestionEntity,
    @InjectRepository(UserGameEntity)
    private readonly userRepository: typeof UserEntity,

    private readonly eventEmutter: EventEmitter2,

    private readonly roomService: RoomsService,
  ) {}

  async create(args: { roomId: string }) {
    const room = await this.roomService.getById({ roomId: args.roomId });
    const answers = await this.answerRepository.find();
    const questions = await this.questionRepository.find();
    const game = new GameEntity();
    game.room = room;

    await this.cacheManager.set(
      getQuestionsStorageCacheKey(args.roomId),
      questions,
    );
    await this.cacheManager.set(getAnswersStorageCacheKey(room.id), answers);

    for await (const user of room.users) {
      const userGame = new UserGameEntity();
      userGame.user = user;

      const isLeader = room.users[0].id === user.id;

      const questions = await this.cacheManager.get<QuestionEntity[]>(
        getQuestionsStorageCacheKey(room.id),
      );
      const randomQuestions: QuestionEntity[] = getRandomElements(questions, 3);
      const randomQuestionsIds = randomQuestions.map((question) => question.id);
      const questionsWithoutSelected = questions.filter(
        (question) => !randomQuestionsIds.includes(question.id),
      );
      await this.cacheManager.set(
        getQuestionsStorageCacheKey(args.roomId),
        questionsWithoutSelected,
      );

      game.questions = randomQuestions;

      if (isLeader) {
        userGame.isLeader = true;
      } else {
        const answers = await this.cacheManager.get<AnswerEntity[]>(
          getAnswersStorageCacheKey(room.id),
        );
        const randomAnswers: AnswerEntity[] = getRandomElements(answers, 7);
        const randomAnswersIds = randomAnswers.map((answer) => answer.id);
        const answersWithoutSelected = answers.filter(
          (question) => !randomAnswersIds.includes(question.id),
        );
        await this.cacheManager.set(
          getAnswersStorageCacheKey(args.roomId),
          answersWithoutSelected,
        );

        userGame.answers = randomAnswers;
      }

      game.usersGame = [...(game.usersGame ?? []), userGame];
    }

    const newGame = await game.save();
    room.game = newGame;
    await room.save();
  }

  async getCommonFieldsGameById(args: { gameId: string }) {
    const game = await this.gameRepository.findOne({
      where: { id: args.gameId },
      relations: ['questions', 'usersGame', 'usersGame.user'],
    });

    return game;
  }

  async getUserGameByUserId(args: { userId: string }) {
    const userGame: UserGameEntity = await this.userGameRepository.findOne({
      where: { user: { id: args.userId } },
      relations: ['user', 'answers'],
    });

    return userGame;
  }
}
