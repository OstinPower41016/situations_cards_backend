import { Room } from '@prisma/client';

export interface IRoomCreateDto extends Pick<Room, 'name' | 'private'> {}

export interface IRoomStartGame {
  roomId: string;
}
