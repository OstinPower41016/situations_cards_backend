import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Response, Request } from 'express';
import { CreateGameDto } from './dto/game.controller.dto';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  async create(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: CreateGameDto,
  ) {
    const game = await this.gameService.create({ roomId: body.roomId });
  }
}
