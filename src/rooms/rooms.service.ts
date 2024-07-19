// src/rooms/rooms.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RoomCreateDto, RoomDto } from 'src/dto/room.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  RoomCreatedEvent,
  RoomUpdatedEvent,
} from './events/roomsCreated.event';
import { Request } from 'express';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getAll(): Promise<RoomDto[]> {
    try {
      const allRooms = await this.prisma.rooms.findMany();
      return allRooms as RoomDto[];
    } catch (error) {
      throw error;
    }
  }

  async create(request: Request, data: RoomCreateDto): Promise<RoomDto> {
    try {
      const currentUserId = request.cookies['_id'];

      await this.removeUserFromRoomIfExist({ userId: currentUserId });

      const createdRoom = await this.prisma.rooms.create({
        data: {
          name: data.name,
          private: data.private,
          participants: [currentUserId],
          status: 'pending',
        },
      });

      this.eventEmitter.emit(
        'room.created',
        new RoomCreatedEvent(createdRoom as RoomDto),
      );
      return createdRoom as RoomDto;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  }

  async addUserToRoom(args: { roomId: string; userId: string }) {
    try {
      const currentRoom = await this.prisma.rooms.findFirst({
        where: { id: args.roomId },
      });

      await this.removeUserFromRoomIfExist({ userId: args.userId });

      const updatedRoom = await this.prisma.rooms.update({
        where: { id: args.roomId },
        data: {
          participants: [...currentRoom.participants, args.userId],
        },
      });

      this.eventEmitter.emit('room.updated');

      return updatedRoom;
    } catch (error) {
      throw error;
    }
  }

  async removeUserFromRoom(args: { roomId: string; userId: string }) {
    try {
      const currentRoom = await this.prisma.rooms.findFirst({
        where: { id: args.roomId },
      });

      const userIndexInParticipants = currentRoom.participants.findIndex(
        (userId) => userId === args.userId,
      );

      const updatedParticipants = [...currentRoom.participants];
      updatedParticipants.splice(userIndexInParticipants, 1);

      if (updatedParticipants.length === 0) {
        await this.prisma.rooms.delete({
          where: { id: args.roomId },
        });

        this.eventEmitter.emit('room.updated');
      } else {
        const updatedRoom = await this.prisma.rooms.update({
          where: { id: args.roomId },
          data: {
            participants: updatedParticipants,
          },
        });

        this.eventEmitter.emit('room.updated');

        return updatedRoom;
      }
    } catch (error) {
      throw error;
    }
  }

  private async removeUserFromRoomIfExist(args: { userId: string }) {
    const roomsWithUser = await this.prisma.rooms.findFirst({
      where: {
        participants: {
          has: args.userId,
        },
      },
    });

    if (roomsWithUser) {
      await this.removeUserFromRoom({
        roomId: roomsWithUser.id,
        userId: args.userId,
      });
    }
  }
}
