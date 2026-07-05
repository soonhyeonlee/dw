import { Module } from '@nestjs/common';
import { MomCafeController } from './momcafe.controller';
import { MomCafeService } from './momcafe.service';

@Module({
  controllers: [MomCafeController],
  providers: [MomCafeService],
})
export class MomCafeModule {}
