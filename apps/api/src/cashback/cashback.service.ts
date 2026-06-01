import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CashbackTransaction } from './entities/cashback-transaction.entity';
import { UsersService } from '../users/users.service';
import { PushNotificationService } from '../common/services/push-notification.service';

@Injectable()
export class CashbackService {
  constructor(
    @InjectRepository(CashbackTransaction)
    private readonly txRepo: Repository<CashbackTransaction>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Optional() private readonly pushService?: PushNotificationService,
  ) {}

  // 캐시백 비율 (플랫폼 수수료 중 사용자에게 돌려주는 비율)
  private getCashbackRate(): number {
    return this.configService.get<number>('CASHBACK_RATE_PERCENT', 50) / 100;
  }

  async createTransaction(data: {
    userId: string;
    productId?: string;
    platform: string;
    orderAmount: number;
    commissionAmount: number;
  }): Promise<CashbackTransaction> {
    const cashbackAmount = data.commissionAmount * this.getCashbackRate();

    const tx = this.txRepo.create({
      ...data,
      cashbackAmount,
      status: 'pending',
    });
    return this.txRepo.save(tx);
  }

  async confirmTransaction(txId: string): Promise<void> {
    const tx = await this.txRepo.findOneOrFail({ where: { id: txId } });
    tx.status = 'confirmed';
    tx.confirmedAt = new Date();
    await this.txRepo.save(tx);

    // 번개장터(아이홈마켓) 구매는 인출 불가한 번개장터 전용 포인트로,
    // 그 외 플랫폼은 인출 가능한 캐시백 잔액으로 적립.
    const isMarket = ['ihomemarket', 'market'].includes(
      (tx.platform || '').toLowerCase(),
    );
    if (isMarket) {
      await this.usersService.addMarketPoint(tx.userId, tx.cashbackAmount);
    } else {
      await this.usersService.updateBalance(tx.userId, tx.cashbackAmount);
    }

    tx.status = 'paid';
    tx.paidAt = new Date();
    await this.txRepo.save(tx);

    // 푸시 알림 발송
    this.pushService?.sendToUser(
      tx.userId,
      isMarket ? '번개장터 포인트 적립!' : '캐시백 적립 완료!',
      `${Number(tx.cashbackAmount).toLocaleString()}${isMarket ? 'P가 적립되었습니다 (번개장터 전용)' : '원이 적립되었습니다'}`,
      { type: isMarket ? 'market_point' : 'cashback', txId: tx.id },
    );
  }

  async cancelTransaction(txId: string): Promise<void> {
    await this.txRepo.update(txId, { status: 'cancelled' });
  }

  async getUserTransactions(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.txRepo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAllTransactions(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.txRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
