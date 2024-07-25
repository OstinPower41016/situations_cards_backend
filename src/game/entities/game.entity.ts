import { CustomBaseEntity } from 'src/entities/base.entity';
import { RoomEntity } from 'src/rooms/entity/room.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { QuestionEntity } from 'src/entities/question.entity';
import { AnswerDto } from 'src/dto/answer.dto';
import { UserGameEntity } from 'src/user/entities/userGame.entity';
import { GameStage } from 'db/allTypes';
import { AnswerEntity } from 'src/entities/answer.entity';
import { UserEntity } from 'src/user/entities/user.entity';

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

  @OneToMany(() => AnswerEntity, (answer) => answer.game)
  selectedAnswers: AnswerEntity[];

  @OneToOne(() => AnswerEntity)
  @JoinColumn()
  winnerAnswer: AnswerEntity;

  @OneToMany(() => UserGameEntity, (userGame) => userGame.game, {
    cascade: true,
  })
  usersGame: UserGameEntity[];

  @Column({
    type: 'uuid',
    nullable: true,
  })
  winnerUserGameId: string;

  @OneToOne(() => RoomEntity, (room) => room.game)
  @JoinColumn()
  room: RoomEntity;
}
