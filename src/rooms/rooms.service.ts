// src/rooms/rooms.service.ts
import { ConflictException, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import { Room } from '@prisma/client';
import { Request } from 'express';
import { IRoomCreateDto } from 'src/dto/room.dto';
import { UserService } from 'src/user/user.service';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomEntity } from './entity/room.entity';
import { UserEntity, UserStatus } from 'src/user/entities/user.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(RoomEntity)
    private readonly roomRepository: typeof RoomEntity,
    private eventEmitter: EventEmitter2,
    @InjectRepository(UserEntity)
    private readonly userRepository: typeof UserEntity,
  ) {}

  async getAll() {
    try {
      const rooms = await this.roomRepository.find({
        relations: {
          users: true,
        },
      });
      return rooms;
    } catch (error) {
      throw error;
    }
  }

  async getById(args: { roomId: string }) {
    const room = await this.roomRepository.findOne({
      where: { id: args.roomId },
      relations: ['users', 'game', 'game.usersGame'],
    });

    return room;
  }

  async create(request: Request, data: IRoomCreateDto) {
    try {
      const currentUserId = request.cookies['_id'];
      const user = await this.userRepository.findOneBy({ id: currentUserId });

      await this.removeUserFromRoomIfExist({ userId: currentUserId });

      const newRoom = new RoomEntity();

      newRoom.name = data.name;
      newRoom.private = data.private;
      newRoom.users = [user];

      const room = await newRoom.save();

      this.eventEmitter.emit('room.created');
      return room;
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

      const room = await this.roomRepository.findOne({
        where: { id: args.roomId },
        relations: ['users'],
      });
      const user = await this.userRepository.findOneBy({ id: args.userId });

      room.users.push(user);

      const updatedRoom = await room.save();

      this.eventEmitter.emit('room.updated', updatedRoom);

      return updatedRoom;
    } catch (error) {
      throw error;
    }
  }

  async removeUserFromRoom(args: { roomId: string; userId: string }) {
    const room = await this.roomRepository.findOne({
      where: { id: args.roomId },
      relations: {
        users: true,
      },
    });
    const currentUserIdx = room.users?.findIndex(
      (user) => user.id === args.userId,
    );

    const user = await this.userRepository.findOneBy({ id: args.userId });
    user.status =
      user.status === UserStatus.IN_LOBBY ? UserStatus.ONLINE : user.status;
    await user.save();

    let updatedRoom: RoomEntity;

    if (room.users.length > 1) {
      room.users = [
        ...room.users.slice(0, currentUserIdx),
        ...room.users.slice(currentUserIdx + 1),
      ];

      updatedRoom = await room.save();
    } else {
      await room.remove();
    }

    this.eventEmitter.emit('room.updated');
    this.eventEmitter.emit('room.updated', updatedRoom);

    return updatedRoom;
  }

  @OnEvent('removeUserFromRoomIfExist')
  private async removeUserFromRoomIfExist(args: { userId: string }) {
    const user = await this.userRepository.findOneBy({ id: args.userId });

    if (user.room) {
      await this.removeUserFromRoom({
        roomId: user.room.id,
        userId: args.userId,
      });
    }
  }
}
