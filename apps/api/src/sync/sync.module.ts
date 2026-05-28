import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { IhomeSyncState } from './entities/ihome-sync-state.entity';
import { IhomeSyncService } from './ihome-sync.service';
import { IhomeSyncController } from './ihome-sync.controller';
import { UsersModule } from '../users/users.module';
import { AdminGuard } from '../common/guards/admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Product, IhomeSyncState]), UsersModule],
  controllers: [IhomeSyncController],
  providers: [IhomeSyncService, AdminGuard],
  exports: [IhomeSyncService],
})
export class SyncModule {}
