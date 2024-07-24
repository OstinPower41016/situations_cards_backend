import { BadRequestException, Inject, Injectable } from '@nestjs/common';
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
import { GameStage, GameUserStatus } from 'db/allTypes';
import shuffle from 'src/utils/shuffle';

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

      const randomQuestions = await this.getRandomRoomGameQuestions({
        roomId: args.roomId,
      });

      game.questions = randomQuestions;

      if (isLeader) {
        userGame.isLeader = true;
        userGame.status = GameUserStatus.CHOOSING_QUESTION;
      }

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

      game.usersGame = [...(game.usersGame ?? []), userGame];
    }

    const newGame = await game.save();
    room.game = newGame;
    await room.save();
    this.eventEmutter.emit('game.created', { roomId: room.id });
  }

  async getCommonFieldsGameByRoomId(args: { roomId: string }) {
    const game = await this.gameRepository.findOne({
      where: {
        room: {
          id: args.roomId,
        },
      },
      relations: [
        'questions',
        'usersGame',
        'usersGame.user',
        'selectedQuestion',
        'selectedAnswers',
        'room',
      ],
    });

    return game;
  }

  async getUserGameByUserId(args: { userId: string }) {
    const userGame: UserGameEntity = await this.userGameRepository.findOne({
      where: { user: { id: args.userId } },
      relations: ['user', 'answers', 'selectedAnswer', 'game'],
    });

    const userGames = await this.userGameRepository.find();

    return userGame;
  }

  async selectQuestion(args: {
    questionId: string;
    roomId: string;
    userId: string;
  }) {
    const questions = await this.cacheManager.get<QuestionEntity[]>(
      getQuestionsStorageCacheKey(args.roomId),
    );

    const currentGame = await this.gameRepository.findOne({
      where: {
        room: {
          id: args.roomId,
        },
      },
      relations: ['usersGame', 'room', 'selectedQuestion', 'questions'],
    });

    const getSelectedQuestion = () => {
      const question = currentGame.questions.find(
        (question) => question.id === args.questionId,
      );
      return question;
    };

    const question = getSelectedQuestion();
    currentGame.selectedQuestion = question;
    currentGame.stage = GameStage.SELECT_ANSWERS;

    for (const userGame of currentGame.usersGame) {
      if (userGame.isLeader) {
        userGame.status = GameUserStatus.WAITING;
      } else {
        userGame.status = GameUserStatus.CHOOSING_ANSWER;
      }
    }

    const newGame = await currentGame.save();

    this.eventEmutter.emit('game.updated', { roomId: newGame.room.id });
    this.eventEmutter.emit('userGame.updated', { userId: args.userId });
  }

  async selectAnswer(args: {
    userId: string;
    answerId: string;
    roomId: string;
  }) {
    const currentGame = await this.gameRepository.findOne({
      where: {
        room: {
          id: args.roomId,
        },
      },
      relations: [
        'usersGame',
        'usersGame.answers',
        'usersGame.user',
        'usersGame.selectedAnswer',
        'room',
      ],
    });

    if (currentGame.stage === GameStage.SELECT_BEST_ANSWER) {
      throw new BadRequestException(
        'Выбор ответов невозможен на этапе выбора лучшего ответа.',
      );
    }

    const userGame = await this.userGameRepository.findOne({
      where: { user: { id: args.userId } },
      relations: ['answers'],
    });

    const selectAnswer = async () => {
      const selectedAnswer = currentGame.usersGame
        .find((user) => user.user.id === args.userId)
        .answers.find((answer) => answer.id === args.answerId);

      userGame.selectedAnswer = selectedAnswer;
    };

    const checkAndUpdateGameStatus = async () => {
      const otherPersonUsersGameWithoutLeader = currentGame.usersGame.filter(
        (currUserGame) =>
          currUserGame.id !== userGame.id && !currUserGame.isLeader,
      );

      const areAllUsersReady = otherPersonUsersGameWithoutLeader.every(
        (currUserGame) => currUserGame.status === GameUserStatus.READY,
      );

      if (areAllUsersReady) {
        currentGame.stage = GameStage.SELECT_BEST_ANSWER;

        const leaderUserGame = currentGame.usersGame.find((ug) => ug.isLeader);

        const userGames = [
          ...otherPersonUsersGameWithoutLeader,
          leaderUserGame,
          userGame,
        ];

        const selectedAnswers = userGames.map(
          (userGame) => userGame.selectedAnswer,
        );

        for (const userGame of currentGame.usersGame) {
          if (userGame.isLeader) {
            userGame.status = GameUserStatus.CHOOSING_BEST_ANSWER;
          } else {
            userGame.status = GameUserStatus.WAITING;
          }
        }

        currentGame.selectedAnswers = shuffle(selectedAnswers);
        await currentGame.save();
      }

      return { areAllUsersReady };
    };

    await selectAnswer();
    const { areAllUsersReady } = await checkAndUpdateGameStatus();

    if (!areAllUsersReady) {
      userGame.status = GameUserStatus.READY;
    }

    await userGame.save();

    this.eventEmutter.emit('game.updated', { roomId: currentGame.room.id });
    this.eventEmutter.emit('userGame.updated', { userId: args.userId });
  }

  async selectBestAnswer(args: { questionId: string }) {
    
  }

  private async getRandomGameAnswer(args: { roomId: string; count?: number }) {
    const { count = 1 } = args;

    const items = await this.cacheManager.get<QuestionEntity[]>(
      getQuestionsStorageCacheKey(args.roomId),
    );
    const randomItems: QuestionEntity[] = getRandomElements(items, count);
    const randomItemsIds = randomItems.map((question) => question.id);
    const itemsWithoutSelected = randomItems.filter(
      (question) => !randomItemsIds.includes(question.id),
    );
    await this.cacheManager.set(
      getAnswersStorageCacheKey(args.roomId),
      itemsWithoutSelected,
    );

    return randomItems;
  }

  private async getRandomRoomGameQuestions(args: { roomId: string }) {
    const questions = await this.cacheManager.get<QuestionEntity[]>(
      getQuestionsStorageCacheKey(args.roomId),
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

    return randomQuestions;
  }
}
