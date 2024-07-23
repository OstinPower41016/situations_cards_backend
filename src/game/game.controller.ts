import { Body, Controller, Patch, Post, Req, Res } from '@nestjs/common';
import {
  CreateGameBodyDto,
  UpdateGameSelectQuestion,
} from './dto/game.controller.dto';
import { Response, Request } from 'express';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('start')
  async create(@Body() body: CreateGameBodyDto) {
    await this.gameService.create({ roomId: body.roomId });
  }

  @Patch('select-question')
  async updateSelectQuestion(
    @Req() request: Request,
    @Body() body: UpdateGameSelectQuestion,
  ) {
    const userId = request.cookies['_id'];
    await this.gameService.selectQuestion({
      roomId: body.roomId,
      questionId: body.questionId,
      userId: userId,
    });
  }
}
