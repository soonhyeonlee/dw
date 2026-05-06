import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import { WithdrawalService } from './withdrawal.service';
import { WithdrawalController } from './withdrawal.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([WithdrawalRequest]), UsersModule],
  providers: [WithdrawalService],
  controllers: [WithdrawalController],
})
export class WithdrawalModule {}
