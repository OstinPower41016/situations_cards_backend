import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { RoomStatus, User } from '@prisma/client';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  uniqueUsernameGenerator,
  nouns,
  adjectives,
} from 'unique-username-generator';
import { UserEntity, UserStatus } from './entities/user.entity';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: typeof UserEntity,
    private eventEmitter: EventEmitter2,
  ) {}

  async getUserMe(request: Request, response: Response) {
    const _id = request.cookies['_id'];

    const createNewUser = async () => {
      const newUser = await this.createGuest();
      response.cookie('_id', newUser.id, {
        httpOnly: true,
        secure: false,
      });
      return newUser;
    };

    if (_id) {
      const user = await this.getUserById(_id);

      if (!user) {
        const newUser = await createNewUser();
        return newUser;
      }

      return new UserDto(user);
    } else {
      const newUser = await createNewUser();
      return newUser;
    }
  }


  async updateUser(userId: string, data: UserEntity) {
    if (userId) {
      try {
        const user = await this.userRepository.findOne({
          where: { id: userId },
          relations: {
            room: true,
          },
        });

        if (!user) {
          throw new InternalServerErrorException('User not found');
        }

        user.nickname = data.nickname ?? user.nickname;
        user.status = data.status ?? user.status;

        if (user.room) {
          if (
            user.status === 'OFFLINE' &&
            user.room.status !== RoomStatus.IN_GAME
          ) {
            this.eventEmitter.emit('removeUserFromRoomIfExist', {
              userId: user.id,
            });
            user.room = null;
          }

          await this.checkAndUpdateRoomStatus({ roomId: user.room.id });
        }

        const updatedUser = await user.save();

        this.eventEmitter.emit('userInRoom.updated', {
          roomId: updatedUser.room?.id,
        });
        return updatedUser;
      } catch (error) {
        if (error.code === 'P2002') {
          throw new ConflictException('Такой ник уже занят');
        } else {
          throw new InternalServerErrorException();
        }
      }
    } else {
      throw new InternalServerErrorException();
    }
  }

  async getUserById(id: string) {
    const user = this.userRepository.findOne({
      where: { id: id },
    });

    return user;
  }

  private async checkAndUpdateRoomStatus(args: { roomId: string }) {
    // const currentRoom = await this.prisma.room.findFirst({
    //   where: { id: args.roomId },
    //   include: {
    //     participants: true,
    //   },
    // });
    // const usersInLobbyCount = currentRoom.participants.filter(
    //   (user) => user.status === 'IN_LOBBY',
    // ).length;
    // let currentRoomStatus = currentRoom.status;
    // if (currentRoomStatus === 'CREATED' && usersInLobbyCount >= 3) {
    //   currentRoomStatus = 'READY_TO_START';
    // }
    // if (currentRoomStatus === 'READY_TO_START' && usersInLobbyCount < 3) {
    //   currentRoomStatus = 'CREATED';
    // }
    // if (currentRoomStatus !== currentRoom.status) {
    //   await this.prisma.room.update({
    //     where: { id: args.roomId },
    //     data: {
    //       status: currentRoomStatus,
    //     },
    //   });
    // }
  }

  private async createGuest() {
    const user = new UserEntity();
    user.nickname = uniqueUsernameGenerator({
      dictionaries: [nouns, adjectives],
    });
    user.guest = true;

    const userData = await user.save();
    return userData;
  }
}
