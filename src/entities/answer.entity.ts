import { Column, Entity, ManyToOne } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { UserGameEntity } from 'src/user/entities/userGame.entity';

@Entity('answers')
export class AnswerEntity extends CustomBaseEntity {
  @Column()
  description: string;

  @ManyToOne(() => UserGameEntity, (userGame) => userGame.answers)
  gameUser: UserGameEntity[];
}
