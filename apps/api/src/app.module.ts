import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { CashbackModule } from './cashback/cashback.module';
import { WithdrawalModule } from './withdrawal/withdrawal.module';
import { SettingsModule } from './settings/settings.module';
import { LlmModule } from './llm/llm.module';
import { BlocksModule } from './blocks/blocks.module';
import { MarketModule } from './market/market.module';
import { RegionModule } from './region/region.module';
import { SyncModule } from './sync/sync.module';
import { BannersModule } from './banners/banners.module';
import { CommonModule } from './common/common.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const dbType = config.get('DB_TYPE', 'postgres');
        if (dbType === 'sqlite') {
          return {
            type: 'better-sqlite3',
            database: config.get('DB_PATH', ':memory:'),
            autoLoadEntities: true,
            synchronize: true,
          };
        }
        const useSsl = config.get('DATABASE_SSL', 'false') === 'true';
        return {
          type: 'postgres',
          host: config.get('DATABASE_HOST', 'localhost'),
          port: config.get<number>('DATABASE_PORT', 5432),
          username: config.get('DATABASE_USER', 'doublewin'),
          password: config.get('DATABASE_PASSWORD', 'doublewin_dev'),
          database: config.get('DATABASE_NAME', 'doublewin'),
          autoLoadEntities: true,
          synchronize: config.get('NODE_ENV') !== 'production',
          ssl: useSsl ? { rejectUnauthorized: false } : false,
        };
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 30,
      },
    ]),
    CommonModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    CashbackModule,
    WithdrawalModule,
    SettingsModule,
    LlmModule,
    BlocksModule,
    MarketModule,
    RegionModule,
    SyncModule,
    BannersModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
