import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Request, Response } from 'express';
import {
  uniqueUsernameGenerator,
  nouns,
  adjectives,
} from 'unique-username-generator';
import { UserEntity, UserStatus } from './entities/user.entity';
import { UserDto, UserInfoDto } from './dto/user.dto';
import { RoomStatus } from 'db/allTypes';
import { GoogleUserDto } from 'src/auth/dto/googleUser.dto';
import { UserGuestCreateBody } from 'src/auth/dto/auth.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: typeof UserEntity,
    private eventEmitter: EventEmitter2,
  ) {}

  async getUserMe(request: Request, response: Response) {
    const _id = request.cookies['_id'];

    if (_id) {
      throw new UnauthorizedException('User is unauthorized');
    }

    const user = await this.getUserById(_id);

    return new UserDto(user); // TODO UserDto ?
  }

  async getOrCreateUserByEmail(user: GoogleUserDto) {
    if (!user) {
      throw new InternalServerErrorException('User is empty');
    }

    const currentUser = await this.userRepository.findOne({
      where: { email: user.email },
    });

    if (currentUser) {
      return new UserInfoDto(currentUser);
    }

    const newUser = await this.createUser(user);

    return new UserInfoDto(newUser);
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

  async createGuest(user: UserGuestCreateBody) {
    const isNickNameAlreadyExist = this.isNicknameAlreadyExist(user.nickname);
    if (isNickNameAlreadyExist) {
      throw new BadRequestException('This nickname already exist');
    }

    const newUser = new UserEntity();
    newUser.nickname = user.nickname;
    newUser.guest = true;

    const userData = await newUser.save();
    return userData;
  }

  async generateUserNickName() {
    const getNewNickname = async (): Promise<string> => {
      const nickname = uniqueUsernameGenerator({
        dictionaries: [nouns, adjectives],
      });

      const isNickNameAlreadyExist =
        await this.isNicknameAlreadyExist(nickname);

      if (isNickNameAlreadyExist) {
        return getNewNickname();
      }
      return nickname;
    };

    const nickname = await getNewNickname();

    return nickname;
  }

  private async isNicknameAlreadyExist(nickname: string) {
    const isNickNameAlreadyExist = await this.userRepository.find({
      where: { nickname: nickname },
    });

    return !!isNickNameAlreadyExist.length;
  }

  private async createUser(user: GoogleUserDto) {
    const newUser = new UserEntity();
    newUser.guest = false;
    newUser.email = user.email;
    newUser.nickname = user.email.split('@')[0];
    const userData = await newUser.save();
    return userData;
  }
}
