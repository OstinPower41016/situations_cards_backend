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
})
export class GameGateway {
  @WebSocketServer() server: Server;

  constructor(private readonly gameService: GameService) {}

  @OnEvent('game.created')
  @OnEvent('game.updated')
  @SubscribeMessage('joinGame')
  async handleUserInRoomUpdated(client: Socket, payload: { gameId: string }) {
    if (payload.gameId) {
      const game = await this.gameService.getCommonFieldsGameById({
        gameId: payload.gameId,
      });

      this.server.emit(`game/${game.id}`, new GameCommonFieldsDto(game));
    } else {
      throw new InternalServerErrorException('gameId is empty');
    }
  }

  @OnEvent('userGame.created')
  @OnEvent('userGame.updated')
  @SubscribeMessage('joinUserToGame')
  async getUserGame(client: Socket) {
    const cookies = client.handshake.headers.cookie;
    const parsedCookies = cookies ? cookie.parse(cookies) : {};
    const userId = parsedCookies['_id'];

    const userGame = await this.gameService.getUserGameByUserId({
      userId: userId,
    });

    if (userGame) {
      this.server.emit(`game/userGame/${userId}`, new UserGameDto(userGame));
    }
  }
}
