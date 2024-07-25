import { Body, Controller, Patch, Post, Req, Res } from '@nestjs/common';
import {
  CreateGameBodyDto,
  GameNextRoundDto,
  GameSelectAnswerDto,
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
  async selectQuestion(
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

  @Patch('select-answer')
  async selectAnswer(
    @Req() request: Request,
    @Body() body: GameSelectAnswerDto,
  ) {
    const userId = request.cookies['_id'];
    await this.gameService.selectAnswer({
      answerId: body.answerId,
      userId: userId,
      roomId: body.roomId,
    });
  }

  @Patch('select-best-answer')
  async selectBestAnswer(
    @Req() request: Request,
    @Body() body: GameSelectAnswerDto,
  ) {
    const userId = request.cookies['_id'];
    await this.gameService.selectBestAnswer({
      answerId: body.answerId,
      userId: userId,
      roomId: body.roomId,
    });
  }

  @Patch('next-round')
  async nextRound(@Body() body: GameNextRoundDto) {
    await this.gameService.nextRound({
      gameId: body.gameId,
    });
  }
}
