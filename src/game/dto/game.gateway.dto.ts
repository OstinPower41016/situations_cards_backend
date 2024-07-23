import { UserEntity } from 'src/user/entities/user.entity';
import { GameEntity, GameStage } from '../entities/game.entity';
import { QuestionEntity } from 'src/entities/question.entity';
import { UserGameEntity } from 'src/user/entities/userGame.entity';
import { AnswerEntity } from 'src/entities/answer.entity';
import { GameUserStatus } from 'db/allTypes';

export class GameCommonFieldsDto {
  id: string;
  questions: QuestionEntity[];
  round: number;
  stage: GameStage;
  usersGame: {
    id: string;
    userId: string;
    nickname: string;
    isLeader: boolean;
    scrore: number;
    status: GameUserStatus;
  }[];

  constructor(game: GameEntity) {
    this.id = game.id;
    this.questions = game.questions;
    this.round = game.round;
    this.stage = game.stage;
    this.usersGame = game.usersGame.map((userGame) => ({
      id: userGame.id,
      userId: userGame.user.id,
      nickname: userGame.user.nickname,
      isLeader: userGame.isLeader,
      scrore: userGame.score,
      status: userGame.status,
    }));
  }
}

export class UserGameDto {
  id: string;
  answers: AnswerEntity[];

  constructor(userGame: UserGameEntity) {
    this.id = userGame.id;
    this.answers = userGame.answers;
  }
}
