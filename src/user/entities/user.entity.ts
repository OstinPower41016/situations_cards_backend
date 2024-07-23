import { AnswerEntity } from 'src/entities/answer.entity';
import { CustomBaseEntity } from 'src/entities/base.entity';
import { QuestionEntity } from 'src/entities/question.entity';
import { RoomEntity } from 'src/rooms/entity/room.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserGameEntity } from './userGame.entity';

export enum UserStatus {
  OFFLINE = 'OFFLINE',
  ONLINE = 'ONLINE',
  IN_LOBBY = 'IN_LOBBY',
  PLAYING = 'PLAYING',
}

@Entity('users')
export class UserEntity extends CustomBaseEntity {
  @Column()
  nickname: string;

  @Column({ default: true })
  guest: boolean;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.ONLINE,
  })
  status: UserStatus;

  @OneToMany(() => UserGameEntity, (userGame) => userGame.user)
  userGame: UserGameEntity[];

  @ManyToOne(() => RoomEntity, (room) => room.users)
  room: RoomEntity;
}
