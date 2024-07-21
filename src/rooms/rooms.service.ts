// src/rooms/rooms.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { Room } from '@prisma/client';
import { Request } from 'express';
import { IRoomCreateDto } from 'src/dto/room.dto';
import { UserService } from 'src/user/user.service';

@Injectable()
export class RoomsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private readonly userService: UserService,
  ) {}

  async getAll(): Promise<Room[]> {
    try {
      const allRooms = await this.prisma.room.findMany();
      return allRooms;
    } catch (error) {
      throw error;
    }
  }

  async getById(args: { roomId: string }) {
    const room = this.prisma.room.findFirst({
      where: { id: args.roomId },
    });

    return room;
  }

  async create(request: Request, data: IRoomCreateDto): Promise<Room> {
    try {
      const currentUserId = request.cookies['_id'];

      await this.removeUserFromRoomIfExist({ userId: currentUserId });

      const createdRoom = await this.prisma.room.create({
        data: {
          name: data.name,
          private: data.private,
          status: 'CREATED',
        },
      });

      this.eventEmitter.emit('room.created');
      return createdRoom;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Комната с таким названием уже существует');
      } else {
        throw error;
      }
    }
  }

  async addUserToRoom(args: { roomId: string; userId: string }) {
    try {
      await this.removeUserFromRoomIfExist({ userId: args.userId });

      const updatedRoom = await this.prisma.room.update({
        where: { id: args.roomId },
        data: {
          participants: {
            connect: { id: args.userId },
          },
        },
        include: {
          participants: true,
        },
      });

      this.eventEmitter.emit('room.updated', updatedRoom);

      return updatedRoom;
    } catch (error) {
      throw error;
    }
  }

  async removeUserFromRoom(args: { roomId: string; userId: string }) {
    try {
      const currentRoom = await this.prisma.room.findFirst({
        where: { id: args.roomId },
        include: {
          participants: true,
        },
      });

      if (currentRoom.participants?.[0].id === args.userId) {
        await this.prisma.user.update({
          where: { id: args.userId },
          data: {
            isLeader: false,
          },
        });

        if (currentRoom.participants.length > 1) {
          await this.prisma.user.update({
            where: { id: currentRoom.participants[1].id },
            data: {
              isLeader: true,
            },
          });
        }
      }

      const updatedRoom = await this.prisma.room.update({
        where: { id: args.roomId },
        data: {
          participants: {
            disconnect: {
              id: args.userId,
            },
          },
        },
        include: {
          participants: true,
        },
      });

      if (updatedRoom.participants.length === 0) {
        await this.prisma.room.delete({
          where: { id: args.roomId },
        });
      }

      this.eventEmitter.emit('room.updated');
      this.eventEmitter.emit('rom.updated', updatedRoom);

      return updatedRoom;
    } catch (error) {
      throw error;
    }
  }

  @OnEvent('removeUserFromRoomIfExist')
  private async removeUserFromRoomIfExist(args: { userId: string }) {
    const roomsWithUser = await this.prisma.room.findFirst({
      where: {
        participants: {
          some: {
            id: args.userId,
          },
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
