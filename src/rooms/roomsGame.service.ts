import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { RoomsService } from './rooms.service';
import { Question, Answer } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

const cards: Record<string, Answer[]> = {};
const questions: Record<string, Question[]> = {};

@Injectable()
export class RoomsGameService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async startGame(args: { roomId: string }) {
    await this.prisma.$transaction(async (prisma) => {
      const allCards = await prisma.answer.findMany();
      const allQuestions = await prisma.question.findMany();

      cards[args.roomId] = allCards;
      allQuestions[args.roomId] = allQuestions;

      const usersInRoomOffline = await prisma.user.findMany({
        where: { roomId: args.roomId, status: { not: 'IN_LOBBY' } },
        select: {
          id: true,
        },
      });

      const roomUpdateData = await prisma.room.update({
        where: { id: args.roomId },
        data: {
          status: 'IN_GAME',
          participants: {
            disconnect: usersInRoomOffline,
          },
          // leaderQuestions: {
          //   connect: randomQuestions,
          // },
        },
        include: {
          participants: true,
        },
      });

      const userLeader = roomUpdateData.participants.find(
        (user) => user.isLeader,
      );

      const randomQuestions = this.selectRandomElements(allQuestions, 3);

      const createdUserGame = await prisma.userGame.create({
        data: {
          userId: userLeader.id,
        },
      });

      const updatedUserGame = await prisma.userGame.update({
        where: { id: createdUserGame.id },
        data: {
          questions: {
            connect: randomQuestions.map((q) => ({
              
            })),
          },
        },
      });

      // await prisma.user.update({
      //   where: { isLeader: true },
      //   data: {
      //     userGame: {

      //     }
      //   }
      // });

      // for await (const participant of roomUpdateData.participants) {
      //   const userCards = this.selectRandomElements(allCards, 7);

      //   await prisma.userGame.createMany({
      //     data: userCards.map((card) => ({
      //       userId: participant.id,
      //       cardId: card.id,
      //       roomId: args.roomId,
      //       questions:
      //     })),
      //   });

      //   await prisma.user.update({
      //     where: { id: participant.id },
      //     data: {
      //       status: 'THINKING',
      //     },
      //   });
      // }

      this.eventEmitter.emit(`room`, roomUpdateData);
    });
  }

  private selectRandomElements<T>(elements: T[], count: number): T[] {
    const shuffled = elements.sort(() => 0.5 - Math.random());
    return shuffled.splice(0, count);
  }
}
