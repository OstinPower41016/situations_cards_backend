import { CustomBaseEntity } from 'src/entities/base.entity';
import { RoomEntity } from 'src/rooms/entity/room.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { QuestionEntity } from 'src/entities/question.entity';
import { AnswerDto } from 'src/dto/answer.dto';
import { UserGameEntity } from 'src/user/entities/userGame.entity';

export enum GameStage {
  'SELECT_QUESTION' = 'SELECT_QUESTION',
  'SELECT_ANSWERS' = 'SELECT_ANSWERS',
  'ROUND_RESULTS' = 'ROUND_RESULTS',
}

@Entity('games')
export class GameEntity extends CustomBaseEntity {
  @Column({
    type: 'enum',
    enum: GameStage,
    default: GameStage.SELECT_QUESTION,
  })
  stage: GameStage;

  @Column({ default: 0 })
  round: number;

  @OneToMany(() => QuestionEntity, (question) => question.game)
  questions: QuestionEntity[];

  @OneToOne(() => QuestionEntity)
  @JoinColumn()
  selectedQuestion: QuestionEntity;

  @OneToMany(() => UserGameEntity, (userGame) => userGame.game, {
    cascade: true,
  })
  usersGame: UserGameEntity[];

  @OneToOne(() => RoomEntity, (room) => room.game)
  @JoinColumn()
  room: RoomEntity;
}
