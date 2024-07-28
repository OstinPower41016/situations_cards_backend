import { InternalServerErrorException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import * as cookie from 'cookie';
import { GameCommonFieldsDto, UserGameDto } from './dto/game.gateway.dto';

@WebSocketGateway({
  cors: true,
  path: '/ws',
  transports: 'websocket',
})
export class GameGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('joinGame')
  async handleUserInRoomUpdated(client: Socket, payload: { roomId: string }) {
    if (payload.roomId) {
      const game = await this.gameService.getCommonFieldsGameByRoomId({
        roomId: payload.roomId,
      });

      client.emit(`game/${game.room.id}`, new GameCommonFieldsDto(game));
    } else {
      throw new InternalServerErrorException('gameId is empty');
    }
  }

  @SubscribeMessage('joinUserToGame')
  async getUserGame(client: Socket) {
    const cookies = client.handshake.headers.cookie;
    const parsedCookies = cookies ? cookie.parse(cookies) : {};
    const userId = parsedCookies['_id'];

    const userGame = await this.gameService.getUserGameByUserId({
      userId: userId,
    });

    if (userGame) {
      client.emit(`game/userGame/${userId}`, new UserGameDto(userGame));
    }
  }

  @OnEvent('game.created')
  @OnEvent('game.updated')
  async handleGameUpdated(event: { roomId: string }) {
    if (event.roomId) {
      const game = await this.gameService.getCommonFieldsGameByRoomId({
        roomId: event.roomId,
      });

      this.server.emit(`game/${game.room.id}`, new GameCommonFieldsDto(game));
    } else {
      throw new InternalServerErrorException('gameId is empty');
    }
  }

  @OnEvent('userGame.created')
  @OnEvent('userGame.updated')
  async handleUserGameUpdated(event: { userId: string }) {
    const userGame = await this.gameService.getUserGameByUserId({
      userId: event.userId,
    });

    if (userGame) {
      this.server.emit(
        `game/userGame/${event.userId}`,
        new UserGameDto(userGame),
      );
    } else {
      throw new InternalServerErrorException('userId is empty');
    }
  }
}
