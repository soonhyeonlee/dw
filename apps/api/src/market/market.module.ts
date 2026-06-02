import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketService } from './market.service';
import { MarketController } from './market.controller';
import { MarketProduct } from './entities/market-product.entity';
import { MarketWishlist } from './entities/market-wishlist.entity';
import { Exhibition } from './entities/exhibition.entity';
import { MarketOrder } from './entities/market-order.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MarketProduct, MarketWishlist, Exhibition, MarketOrder]),
    UsersModule,
  ],
  controllers: [MarketController],
  providers: [MarketService],
  exports: [MarketService],
})
export class MarketModule {}
