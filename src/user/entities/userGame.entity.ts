import { AnswerEntity } from 'src/entities/answer.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { GameEntity } from 'src/game/entities/game.entity';
import { CustomBaseEntity } from 'src/entities/base.entity';
import { GameUserStatus } from 'db/allTypes';

@Entity('users_games')
export class UserGameEntity extends CustomBaseEntity {
  @ManyToOne(() => UserEntity, (user) => user.userGame, { cascade: true })
  user: UserEntity;

  @ManyToOne(() => GameEntity, (game) => game.usersGame)
  game: GameEntity;

  @OneToMany(() => AnswerEntity, (answer) => answer.gameUser)
  answers: AnswerEntity[];

  @OneToOne(() => AnswerEntity)
  @JoinColumn()
  selectedAnswer: AnswerEntity;

  @Column({ default: 0 })
  score: number;

  @Column({ default: false })
  isLeader: boolean;

  @Column({
    type: 'enum',
    enum: GameUserStatus,
    default: GameUserStatus.WAITING,
  })
  status: GameUserStatus;
}
