import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { PrismaService } from './prisma/prisma.service';
import { RoomsModule } from './rooms/rooms.module';
import { RoomsGateway } from './rooms/rooms.gateway';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'db/data-source';
import { GameModule } from './game/game.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  providers: [],
  controllers: [],
  exports: [],
  imports: [
    CacheModule.register({isGlobal: true}),
    TypeOrmModule.forRoot(dataSourceOptions),
    EventEmitterModule.forRoot(),
    RoomsModule,
    UserModule,
    GameModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('/');
  }
}
