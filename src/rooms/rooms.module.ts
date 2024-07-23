import { Module } from '@nestjs/common';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { UserModule } from 'src/user/user.module';
import { RoomsGateway } from './rooms.gateway';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoomEntity } from './entity/room.entity';
import { UserEntity } from 'src/user/entities/user.entity';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService, RoomsGateway],
  imports: [TypeOrmModule.forFeature([RoomEntity, UserEntity]), UserModule],
  exports: [RoomsService],
})
export class RoomsModule {}
