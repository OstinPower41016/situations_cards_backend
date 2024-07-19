import { Room } from '@prisma/client';

export class RoomCreatedEvent {
  constructor(public readonly room: Room) {}
}

export class RoomUpdatedEvent {
  constructor(public readonly room: Room) {}
}
