import { TypeOrmModule } from '@nestjs/typeorm';
import { GameEntity } from './entities/game.entity';
import { RoomsService } from 'src/rooms/rooms.service';
import { Module } from '@nestjs/common';
import { RoomsModule } from 'src/rooms/rooms.module';
import { AnswerEntity } from 'src/entities/answer.entity';
import { QuestionEntity } from 'src/entities/question.entity';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';
import { UserGameEntity } from 'src/user/entities/userGame.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GameEntity,
      UserGameEntity,
      AnswerEntity,
      QuestionEntity,
    ]),
    RoomsModule,
  ],
  controllers: [GameController],
  providers: [GameService, GameGateway],
})
export class GameModule {}
