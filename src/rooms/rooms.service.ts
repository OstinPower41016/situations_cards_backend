// src/rooms/rooms.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoomCreateDto, RoomDto } from 'src/dto/room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomCreatedEvent } from './events/roomsCreated.event';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getAll(): Promise<RoomDto[]> {
    try {
      const allRooms = await this.prisma.rooms.findMany();
      return allRooms;
    } catch (error) {
      throw error;
    }
  }

  async create(data: RoomCreateDto): Promise<RoomDto> {
    try {
      const createdRoom = await this.prisma.rooms.create({
        data: data,
      });
      this.eventEmitter.emit('room.created', new RoomCreatedEvent(createdRoom));
      return createdRoom;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }
}
