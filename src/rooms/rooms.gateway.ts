import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import {
  RoomCreatedEvent,
  RoomUpdatedEvent,
} from './events/roomsCreated.event';
import { UserService } from 'src/user/user.service';
import { RoomsService } from './rooms.service';
import * as cookie from 'cookie';

@WebSocketGateway({
  cors: true,
})
export class RoomsGateway implements OnGatewayInit, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private prisma: PrismaService,
    private readonly roomService: RoomsService,
    private readonly userService: UserService,
  ) {}
  handleDisconnect(client: Socket) {
    const cookies = client.handshake.headers.cookie;
    const parsedCookies = cookies ? cookie.parse(cookies) : {};
    const id = parsedCookies['_id'];
    // this.userService.updateUser(id, {
    //   status: 'OFFLINE',
    // }); //TODO
  }

  afterInit(server: any) {}

  @SubscribeMessage('rooms')
  async getRooms(client: Socket) {
    const rooms = await this.roomService.getAll();
    client.emit('rooms', rooms);
  }

  @OnEvent('room.created')
  async handleRoomCreated(event: RoomCreatedEvent) {
    const rooms = await this.prisma.room.findMany({
      include: {
        participants: true,
      },
    });
    this.server.emit('rooms', rooms);
  }

  @OnEvent('room.updated')
  async handleUpdatedRoom(event: RoomUpdatedEvent) {
    const rooms = await this.prisma.room.findMany({
      include: {
        participants: true,
      },
    });
    this.server.emit('rooms', rooms);
  }
}
