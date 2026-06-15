import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ClickLog } from './entities/click-log.entity';
import { Wishlist } from './entities/wishlist.entity';
import { MallWishlist } from './entities/mall-wishlist.entity';
import { Mall } from '../blocks/entities/mall.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { UsersModule } from '../users/users.module';
import { AdminGuard } from '../common/guards/admin.guard';
import { AffiliateModule } from '../affiliate/affiliate.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ClickLog, Wishlist, MallWishlist, Mall]), UsersModule, AffiliateModule],
  providers: [ProductsService, AdminGuard],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
