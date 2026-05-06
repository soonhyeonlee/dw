import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BlocksService } from './blocks.service';
import { BlocksController } from './blocks.controller';
import { HomeBlock } from './entities/home-block.entity';
import { Mall } from './entities/mall.entity';
import { Product } from '../products/entities/product.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([HomeBlock, Mall, Product]), UsersModule],
  controllers: [BlocksController],
  providers: [BlocksService],
  exports: [BlocksService],
})
export class BlocksModule {}
