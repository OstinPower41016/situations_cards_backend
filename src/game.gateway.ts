import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

interface Room {
  players: string[];
  cards: string[];
  hands: { [key: string]: string[] };
}

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayInit {
  @WebSocketServer() server: Server;
  private rooms: { [key: string]: Room } = {};

  private allCards = [
    'Card 1',
    'Card 2',
    'Card 3',
    'Card 4',
    'Card 5',
    'Card 6',
    'Card 7',
    'Card 8',
    'Card 9',
    'Card 10',
  ];

  afterInit(server: Server) {
    console.info('WebSocket initialized');
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(client: Socket): void {
    const roomId = Math.random().toString(36).substring(2, 9);
    this.rooms[roomId] = { players: [], cards: [...this.allCards], hands: {} };
    client.join(roomId);
    client.emit('roomCreated', roomId);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(client: Socket, roomId: string): void {
    if (this.rooms[roomId]) {
      client.join(roomId);
      this.rooms[roomId].players.push(client.id);
      this.rooms[roomId].hands[client.id] = this.drawCards(roomId, 5);
      client.emit('hand', this.rooms[roomId].hands[client.id]);
      this.server.to(roomId).emit('playerJoined', client.id);
    } else {
      client.emit('error', 'Room does not exist');
    }
  }

  @SubscribeMessage('playCard')
  handlePlayCard(
    client: Socket,
    { roomId, card }: { roomId: string; card: string },
  ): void {
    if (this.rooms[roomId]) {
      const playerHand = this.rooms[roomId].hands[client.id];
      const cardIndex = playerHand.indexOf(card);
      if (cardIndex > -1) {
        playerHand.splice(cardIndex, 1);
        this.server
          .to(roomId)
          .emit('cardPlayed', { playerId: client.id, card });
      }
    }
  }

  private drawCards(roomId: string, count: number): string[] {
    const room = this.rooms[roomId];
    const drawnCards = [];
    for (let i = 0; i < count; i++) {
      const card = room.cards.pop();
      if (card) drawnCards.push(card);
    }
    return drawnCards;
  }
}
