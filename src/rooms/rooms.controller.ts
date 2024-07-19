import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Response, Request } from 'express';
import { request } from 'http';
import { IRoomCreateDto } from 'src/dto/room.dto';

@Controller('room')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post('create')
  async createRoom(
    @Req() request: Request,
    @Res() response: Response,
    @Body() body: IRoomCreateDto,
  ) {
    return this.roomsService.create(request, body);
  }

  @Patch(':roomId/add-user')
  async adduserToRoom(
    @Req() request: Request,
    @Res() response: Response,
    @Param('roomId') roomId: string,
  ) {
    const userId = request.cookies['_id'];
    const updatedRoom = this.roomsService.addUserToRoom({ roomId, userId });

    response.json(updatedRoom);
  }

  @Patch(':roomId/remove-user')
  async deleteUserFromRoom(
    @Req() request: Request,
    @Res() response: Response,
    @Param('roomId') roomId: string,
  ) {
    const userId = request.cookies['_id'];
    const updatedRoom = this.roomsService.removeUserFromRoom({
      roomId,
      userId,
    });

    response.json(updatedRoom);
  }
}
