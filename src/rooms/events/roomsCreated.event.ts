import { RoomDto } from 'src/dto/room.dto';

export class RoomCreatedEvent {
  constructor(public readonly room: RoomDto) {}
}

export class RoomUpdatedEvent {
  constructor(public readonly room: RoomDto) {}
}
