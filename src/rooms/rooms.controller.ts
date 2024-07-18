import { Body, Controller, Get, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomCreateDto } from 'src/dto/room.dto';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  // @Get()
  // async getAllRooms() {
  //   return this.roomsService.getAll();
  // }

  @Post('create')
  async createRoom(@Body() body: RoomCreateDto) {
    return this.roomsService.create(body);
  }
}
