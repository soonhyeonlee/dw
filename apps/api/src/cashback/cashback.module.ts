import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashbackTransaction } from './entities/cashback-transaction.entity';
import { CashbackService } from './cashback.service';
import { CashbackController } from './cashback.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([CashbackTransaction]), UsersModule],
  providers: [CashbackService],
  controllers: [CashbackController],
  exports: [CashbackService],
})
export class CashbackModule {}
