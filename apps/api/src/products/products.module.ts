import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ClickLog } from './entities/click-log.entity';
import { Wishlist } from './entities/wishlist.entity';
import { MallWishlist } from './entities/mall-wishlist.entity';
import { Mall } from '../blocks/entities/mall.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ClickLog, Wishlist, MallWishlist, Mall])],
  providers: [ProductsService],
  controllers: [ProductsController],
  exports: [ProductsService],
})
export class ProductsModule {}
