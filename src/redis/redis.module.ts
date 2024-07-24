import { Module } from '@nestjs/common';
import { redisStore } from 'cache-manager-redis-store';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import type { RedisClientOptions } from 'redis';

@Module({
  imports: [
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: async () => ({
        ttl: 86400,
        store: (await redisStore({
          url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
        })) as unknown as CacheStore,
      }),
    }),
  ],
})
export class RedisModule {}
