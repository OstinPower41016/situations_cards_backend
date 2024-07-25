import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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

  async nextRound(args: { gameId: string }) {
    const currentGame = await this.gameRepository.findOne({
      where: { id: args.gameId },
      relations: [
        'room',
        'usersGame',
        'usersGame.selectedAnswer',
        'usersGame.answers',
      ],
    });

    const setNewLeader = () => {
      const currentLeaderIdx = currentGame.usersGame.findIndex(
        (ug) => ug.isLeader,
      );
      const isLastLeaderInList =
        currentGame.usersGame.length === currentLeaderIdx + 1;

      currentGame.usersGame[currentLeaderIdx].isLeader = false;

      if (isLastLeaderInList) {
        currentGame.usersGame[0].isLeader = true;
      } else {
        currentGame.usersGame[currentLeaderIdx + 1].isLeader = true;
      }
    };

    const updateUsersGame = async () => {
      let i = 0;
      for await (const userGame of currentGame.usersGame) {
        if (userGame.selectedAnswer) {
          const newAnswers = await this.getRandomGameAnswers({
            roomId: currentGame.room.id,
          });
          const newAnswer = newAnswers[0];

          const selectedAnswerIdx = userGame.answers.findIndex(
            (answer) => answer.id === userGame.selectedAnswer.id,
          );

          if (selectedAnswerIdx === -1) {
            throw new InternalServerErrorException();
          }

          currentGame.usersGame[i].answers = userGame.answers;
          currentGame.usersGame[i].selectedAnswer = null;

          userGame.answers.splice(selectedAnswerIdx, 1, newAnswer);
        }

        if (userGame.isLeader) {
          currentGame.usersGame[i].status = GameUserStatus.CHOOSING_QUESTION;
        } else {
          currentGame.usersGame[i].status = GameUserStatus.WAITING;
        }
        i++;
      }
    };

    const setNewQuestions = async () => {
      const newRandomQuestions = await this.getRandomRoomGameQuestions({
        roomId: currentGame.room.id,
      });
      currentGame.questions = newRandomQuestions;
    };

    setNewLeader();
    await updateUsersGame();
    await setNewQuestions();
    currentGame.round += 1;
    currentGame.stage = GameStage.SELECT_QUESTION;
    currentGame.selectedAnswers = null;
    currentGame.selectedQuestion = null;
    currentGame.winnerUserGameId = null;
    currentGame.winnerAnswer = null;

    await currentGame.save();

    this.eventEmutter.emit('game.updated', { roomId: currentGame.room.id });
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
        'winnerAnswer',
      ],
    });

    return game;
  }

  async getUserGameByUserId(args: { userId: string }) {
    const userGame: UserGameEntity = await this.userGameRepository.findOne({
      where: { user: { id: args.userId } },
      relations: ['user', 'answers', 'selectedAnswer', 'game'],
    });

    return userGame;
  }

  async selectQuestion(args: {
    questionId: string;
    roomId: string;
    userId: string;
  }) {
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

    const selectUserGameAnswer = async () => {
      const selectedUserGameIdx = currentGame.usersGame.findIndex(
        (user) => user.user.id === args.userId,
      );
      const selectedAnswerIdx = currentGame.usersGame[
        selectedUserGameIdx
      ].answers.findIndex((answer) => answer.id === args.answerId);

      currentGame.usersGame[selectedUserGameIdx].selectedAnswer =
        currentGame.usersGame[selectedUserGameIdx].answers[selectedAnswerIdx];
      currentGame.usersGame[selectedUserGameIdx].status = GameUserStatus.READY;
    };

    const checkAndUpdateGameStatus = async () => {
      const currentUserGame = currentGame.usersGame.find(
        (ug) => ug.user.id === args.userId,
      );

      const otherPersonUsersGameWithoutLeader = currentGame.usersGame.filter(
        (currUserGame) =>
          currUserGame.id !== currentUserGame.id && !currUserGame.isLeader,
      );

      const areAllUsersReady = otherPersonUsersGameWithoutLeader.every(
        (currUserGame) => currUserGame.status === GameUserStatus.READY,
      );

      if (areAllUsersReady) {
        currentGame.stage = GameStage.SELECT_BEST_ANSWER;

        for (const userGame of currentGame.usersGame) {
          if (userGame.isLeader) {
            userGame.status = GameUserStatus.CHOOSING_BEST_ANSWER;
          } else {
            userGame.status = GameUserStatus.WAITING;
          }
        }

        currentGame.selectedAnswers = currentGame.usersGame
          .map((ug) => ug.selectedAnswer)
          .filter((selectedAnswer) => selectedAnswer);
      }

      return { areAllUsersReady };
    };

    await selectUserGameAnswer();
    const { areAllUsersReady } = await checkAndUpdateGameStatus();

    await currentGame.save();

    this.eventEmutter.emit('game.updated', { roomId: currentGame.room.id });
    this.eventEmutter.emit('userGame.updated', { userId: args.userId });
  }

  async selectBestAnswer(args: {
    answerId: string;
    roomId: string;
    userId: string;
  }) {
    const currentGame = await this.gameRepository.findOne({
      where: { room: { id: args.roomId } },
      relations: ['selectedAnswers', 'usersGame', 'usersGame.answers', 'room'],
    });

    if (currentGame.stage === GameStage.ROUND_RESULTS) {
      throw new BadRequestException('Раунд уже закончен');
    }

    const setWinnerQuestionAndUser = () => {
      currentGame.winnerAnswer = currentGame.selectedAnswers.find(
        (answer) => answer.id === args.answerId,
      );

      const usersGameAnswersIds = currentGame.usersGame.flatMap((ug) => ({
        user: ug,
        answersIds: ug.answers.map((answer) => answer.id),
      }));

      const winnerUser = usersGameAnswersIds.find((user) =>
        user.answersIds.includes(args.answerId),
      );
      currentGame.winnerUserGameId = winnerUser.user.id;
    };

    const updateStatusesAndScore = () => {
      currentGame.stage = GameStage.ROUND_RESULTS;
      for (const userGame of currentGame.usersGame) {
        userGame.status = GameUserStatus.READY;
        if (currentGame.winnerUserGameId === userGame.id) {
          userGame.score += 1;
        }
      }
    };

    setWinnerQuestionAndUser();
    updateStatusesAndScore();

    await currentGame.save();
    this.eventEmutter.emit('game.updated', { roomId: currentGame.room.id });
    this.eventEmutter.emit('userGame.updated', { userId: args.userId });
  }

  private async getRandomGameAnswers(args: { roomId: string; count?: number }) {
    const { count = 1 } = args;

    const items = await this.cacheManager.get<AnswerEntity[]>(
      getAnswersStorageCacheKey(args.roomId),
    );

    const randomItems: AnswerEntity[] = getRandomElements(items, count);
    const randomItemsIds = randomItems.map((item) => item.id);
    const itemsWithoutSelected = items.filter(
      (item) => !randomItemsIds.includes(item.id),
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
