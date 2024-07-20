import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User } from '@prisma/client';
import { Request, Response } from 'express';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  uniqueUsernameGenerator,
  nouns,
  adjectives,
} from 'unique-username-generator';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async getUserMe(request: Request, response: Response): Promise<User> {
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

      return user;
    } else {
      const newUser = await createNewUser();
      return newUser;
    }
  }

  async updateUser(userId: string, data: Partial<User>): Promise<User> {
    if (userId) {
      try {
        const updatedUser = await this.prisma.$transaction(async (prisma) => {
          const currentUser = await prisma.user.findUnique({
            where: { id: userId },
            include: { room: true },
          });

          if (!currentUser) {
            throw new InternalServerErrorException('User not found');
          }

          const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: data,
            select: {
              guest: true,
              id: true,
              nickname: true,
              status: true,
              room: true,
              roomId: true,
              createdAt: true,
              updatedAt: true,
            },
          });

          if (currentUser.room) {
            if (
              updatedUser.status === 'OFFLINE' &&
              currentUser.room.status !== 'IN_GAME'
            ) {
              this.eventEmitter.emit('removeUserFromRoomIfExist', {
                userId: currentUser.id,
              });
            }

            const participants = await prisma.user.findMany({
              where: { roomId: currentUser.room.id },
            });

            const updatedRoom = await prisma.room.update({
              where: { id: currentUser.room.id },
              data: {
                participants: {
                  set: participants.map((p) => ({ id: p.id })),
                },
              },
              include: {
                participants: true,
              },
            });

            this.eventEmitter.emit('room.updated', updatedRoom);
          }

          return updatedUser;
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

  async getUserById(id: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: id,
      },
      select: {
        id: true,
        nickname: true,
        status: true,
        guest: true,
        room: true,
        roomId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  private async createGuest(): Promise<User> {
    const newUser = this.prisma.user.create({
      data: {
        nickname: uniqueUsernameGenerator({
          dictionaries: [nouns, adjectives],
        }),
        guest: true,
      },
      select: {
        guest: true,
        id: true,
        nickname: true,
        status: true,
        room: true,
        roomId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return newUser;
  }
}
