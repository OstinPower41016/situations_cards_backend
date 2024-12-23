import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerMiddleware } from './middleware/logger.middleware';
import { RoomsModule } from './rooms/rooms.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from 'db/data-source';
import { GameModule } from './game/game.module';
import { CacheModule } from '@nestjs/cache-manager';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';

@Module({
  providers: [],
  controllers: [],
  exports: [],
  imports: [
    RedisModule,
    TypeOrmModule.forRoot(dataSourceOptions),
    EventEmitterModule.forRoot(),
    AuthModule,
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
