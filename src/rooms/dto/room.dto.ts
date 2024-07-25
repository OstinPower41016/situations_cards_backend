import { UserDto } from 'src/user/dto/user.dto';
import { RoomEntity } from '../entity/room.entity';
import { UserEntity } from 'src/user/entities/user.entity';

export class RoomDto {
  id: string;
  name: string;
  private: boolean;
  status: any;
  users: UserEntity[];

  constructor(room: RoomEntity) {
    this.id = room.id;
    this.name = room.name;
    this.private = room.private;
    this.status = room.status;
    this.users = room.users;
  }
}
