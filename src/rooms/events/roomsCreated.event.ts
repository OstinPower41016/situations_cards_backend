import { RoomEntity } from '../entity/room.entity';

export class RoomCreatedEvent {
  constructor(public readonly room: RoomEntity) {}
}

export class RoomUpdatedEvent {
  constructor(public readonly room: RoomEntity) {}
}
