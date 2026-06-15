import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClickLog } from '../products/entities/click-log.entity';
import { Product } from '../products/entities/product.entity';
import { CashbackModule } from '../cashback/cashback.module';
import { UsersModule } from '../users/users.module';
import { AdminGuard } from '../common/guards/admin.guard';
import { CoupangPartnersService } from './coupang-partners.service';
import { AffiliateService } from './affiliate.service';
import { AffiliateController } from './affiliate.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClickLog, Product]),
    CashbackModule,
    UsersModule,
  ],
  providers: [CoupangPartnersService, AffiliateService, AdminGuard],
  controllers: [AffiliateController],
  exports: [CoupangPartnersService],
})
export class AffiliateModule {}
