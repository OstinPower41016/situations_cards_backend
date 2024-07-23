import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CustomBaseEntity } from './base.entity';
import { GameEntity } from 'src/game/entities/game.entity';

@Entity('questions')
export class QuestionEntity extends CustomBaseEntity {
  @Column()
  description: string;

  @ManyToOne(() => GameEntity, (game) => game.questions)
  game: GameEntity[];
}
