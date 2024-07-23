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

  @SubscribeMessage('getGame')
  async handleUserInRoomUpdated(client: Socket, data: { gameId: string }) {
    if (data.gameId) {
      const game = await this.gameService.getCommonFieldsGameById({
        gameId: data.gameId,
      });

      this.server.emit(`game/${game.id}`, new GameCommonFieldsDto(game));
    } else {
      throw new InternalServerErrorException('gameId is empty');
    }
  }

  @OnEvent('userGame.created')
  @SubscribeMessage('getUserGame')
  async getUserGame(client: Socket) {
    const cookies = client.handshake.headers.cookie;
    const parsedCookies = cookies ? cookie.parse(cookies) : {};
    const userId = parsedCookies['_id'];

    const userGame = await this.gameService.getUserGameByUserId({
      userId: userId,
    });

    this.server.emit(`game/userGame/${userId}`, new UserGameDto(userGame));
  }
}
