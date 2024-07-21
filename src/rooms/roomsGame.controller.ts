import { Body, Controller, Post } from '@nestjs/common';
import { IRoomStartGame } from 'src/dto/room.dto';
import { RoomsGameService } from './roomsGame.service';

@Controller('room-game')
export class RoomGameController {
  constructor(private roomGameService: RoomsGameService) {}

  @Post()
  async startGame(@Body() body: IRoomStartGame) {
    await this.roomGameService.startGame(body);
  }
}
