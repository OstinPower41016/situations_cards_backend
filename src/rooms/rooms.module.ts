import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserModule } from 'src/user/user.module';
import { RoomsGateway } from './rooms.gateway';
import { RoomsGameService } from './roomsGame.service';
import { RoomGameController } from './roomsGame.controller';

@Module({
  controllers: [RoomsController, RoomGameController],
  providers: [PrismaService, RoomsService, RoomsGameService, RoomsGateway],
  imports: [UserModule],
})
export class RoomsModule {}
