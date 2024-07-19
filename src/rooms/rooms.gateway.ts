import {
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

@WebSocketGateway({
  cors: true,
})
export class RoomsGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;

  constructor(private prisma: PrismaService) {}

  afterInit(server: any) {}

  @SubscribeMessage('rooms')
  async getRooms(client: Socket) {
    const rooms = await this.prisma.rooms.findMany();
    client.emit('rooms', rooms);
  }

  @OnEvent('room.created')
  async handleRoomCreated(event: RoomCreatedEvent) {
    const rooms = await this.prisma.rooms.findMany();
    this.server.emit('rooms', rooms);
  }

  @OnEvent('room.updated')
  async handleUpdatedRoom(event: RoomUpdatedEvent) {
    const rooms = await this.prisma.rooms.findMany();
    this.server.emit('rooms', rooms);
  }
}
