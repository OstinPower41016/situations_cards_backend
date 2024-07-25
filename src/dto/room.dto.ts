import { RoomEntity } from 'src/rooms/entity/room.entity';

export interface IRoomCreateDto extends Pick<RoomEntity, 'name' | 'private'> {}

export interface IRoomStartGame {
  roomId: string;
}
