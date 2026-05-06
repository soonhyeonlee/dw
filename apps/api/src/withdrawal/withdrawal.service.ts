import { Injectable, BadRequestException, NotFoundException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { WithdrawalRequest } from './entities/withdrawal-request.entity';
import { UsersService } from '../users/users.service';
import { PushNotificationService } from '../common/services/push-notification.service';

@Injectable()
export class WithdrawalService {
  constructor(
    @InjectRepository(WithdrawalRequest)
    private readonly withdrawalRepo: Repository<WithdrawalRequest>,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @Optional() private readonly pushService?: PushNotificationService,
  ) {}

  async requestWithdrawal(
    userId: string,
    amount: number,
    bankName: string,
    accountNumber: string,
    accountHolder: string,
  ): Promise<WithdrawalRequest> {
    const minAmount = this.configService.get<number>(
      'MIN_WITHDRAWAL_AMOUNT',
      5000,
    );

    if (amount < minAmount) {
      throw new BadRequestException(
        `최소 출금 금액은 ${minAmount.toLocaleString()}원입니다`,
      );
    }

    const user = await this.usersService.findById(userId);
    if (user.cashbackBalance < amount) {
      throw new BadRequestException('잔액이 부족합니다');
    }

    // 잔액 차감
    await this.usersService.deductBalance(userId, amount);

    const request = this.withdrawalRepo.create({
      userId,
      amount,
      bankName,
      accountNumber,
      accountHolder,
      status: 'requested',
    });
    return this.withdrawalRepo.save(request);
  }

  async getUserWithdrawals(userId: string, page = 1, limit = 20) {
    const [items, total] = await this.withdrawalRepo.findAndCount({
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

  async getAllWithdrawals(page = 1, limit = 20, status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.withdrawalRepo.findAndCount({
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

  async approveWithdrawal(id: string): Promise<void> {
    const request = await this.withdrawalRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('출금 요청을 찾을 수 없습니다');
    }
    if (request.status !== 'requested') {
      throw new BadRequestException('이미 처리된 요청입니다');
    }

    request.status = 'completed';
    request.processedAt = new Date();
    await this.withdrawalRepo.save(request);

    this.pushService?.sendToUser(
      request.userId,
      '출금 완료',
      `${Number(request.amount).toLocaleString()}원이 출금 처리되었습니다`,
      { type: 'withdrawal_completed', requestId: request.id },
    );
  }

  async rejectWithdrawal(id: string, reason: string): Promise<void> {
    const request = await this.withdrawalRepo.findOne({ where: { id } });
    if (!request) {
      throw new NotFoundException('출금 요청을 찾을 수 없습니다');
    }
    if (request.status !== 'requested') {
      throw new BadRequestException('이미 처리된 요청입니다');
    }

    // 잔액 복원
    await this.usersService.updateBalance(request.userId, Number(request.amount));

    request.status = 'rejected';
    request.rejectionReason = reason;
    request.processedAt = new Date();
    await this.withdrawalRepo.save(request);

    this.pushService?.sendToUser(
      request.userId,
      '출금 거절',
      `출금 요청이 거절되었습니다. 사유: ${reason}`,
      { type: 'withdrawal_rejected', requestId: request.id },
    );
  }
}
