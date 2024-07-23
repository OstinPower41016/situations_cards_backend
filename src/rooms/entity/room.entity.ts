import { CustomBaseEntity } from 'src/entities/base.entity';
import { GameEntity } from 'src/game/entities/game.entity';
import { UserEntity } from 'src/user/entities/user.entity';
import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';

enum RoomStatus {
  CREATED = 'CREATED',
  READY_TO_START = 'READY_TO_START',
  IN_GAME = 'IN_GAME',
  INACTIVE = 'INACTIVE',
}

@Entity('rooms')
export class RoomEntity extends CustomBaseEntity {
  @Column()
  name: string;

  @Column({ default: false })
  private: boolean;

  @Column({
    type: 'enum',
    enum: RoomStatus,
    default: RoomStatus.CREATED,
  })
  status: RoomStatus;

  @OneToOne(() => GameEntity, (game) => game.room)
  game: GameEntity;

  @OneToMany(() => UserEntity, (user) => user.room)
  users: UserEntity[];
}
