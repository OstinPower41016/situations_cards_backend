import { AnswerDto } from 'src/dto/answer.dto';
import { QuestionDto } from 'src/dto/question.dto';
import { RoomDto } from 'src/rooms/dto/room.dto';
import { UserEntity, UserStatus } from '../entities/user.entity';
import { RoomEntity } from 'src/rooms/entity/room.entity';

export class UserDto {
  id: string;
  nickname: string;
  guest: boolean;
  status: keyof typeof UserStatus;
  score: boolean | null;
  room?: RoomEntity;

  constructor(user: UserEntity) {
    this.id = user.id;
    this.nickname = user.nickname;
    this.guest = true;
    this.status = user.status;
    this.room = user.room;
  }
}
