import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { UserGameEntity } from 'src/user/entities/userGame.entity';
import { GameEntity } from 'src/game/entities/game.entity';

@Entity('answers')
export class AnswerEntity extends CustomBaseEntity {
  @Column()
  description: string;

  @ManyToOne(() => UserGameEntity, (userGame) => userGame.answers)
  gameUser: UserGameEntity[];

  @ManyToOne(() => GameEntity, (game) => game.selectedAnswers)
  game: GameEntity;
}
