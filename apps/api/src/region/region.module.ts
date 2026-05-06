import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionService } from './region.service';
import { RegionController } from './region.controller';
import { Academy } from './entities/academy.entity';
import { AcademyReview } from './entities/academy-review.entity';
import { Coupon } from './entities/coupon.entity';
import { UserCoupon } from './entities/user-coupon.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Academy, AcademyReview, Coupon, UserCoupon]), UsersModule],
  controllers: [RegionController],
  providers: [RegionService],
  exports: [RegionService],
})
export class RegionModule {}
