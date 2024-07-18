import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Req,
} from '@nestjs/common';
import { throws } from 'assert';
import { Request, Response } from 'express';
import { UserDto } from 'src/dto/user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  uniqueUsernameGenerator,
  nouns,
  adjectives,
} from 'unique-username-generator';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getUserMe(request: Request, response: Response) {
    const _id = request.cookies['_id'];

    if (_id) {
      const user = await this.getUserById(_id);

      return user;
    } else {
      const newUser = await this.createGuest();
      response.cookie('_id', newUser.id, {
        httpOnly: true,
        secure: false,
      });
      return newUser;
    }
  }

  async updateUser(request: Request, data: Partial<UserDto>) {
    const _id = request.cookies['_id'];

    if (_id) {
      try {
        const updatedUser = await this.prisma.users.update({
          where: { id: _id },
          data: {
            ...data,
          },
          select: {
            guest: true,
            id: true,
            nickname: true,
          },
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

  private async getUserById(id: string) {
    const user = await this.prisma.users.findFirst({
      where: {
        id: id,
      },
      select: {
        guest: true,
        id: true,
        nickname: true,
      },
    });

    return user;
  }

  private async createGuest() {
    const newUser = this.prisma.users.create({
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
      },
    });

    return newUser;
  }
}
