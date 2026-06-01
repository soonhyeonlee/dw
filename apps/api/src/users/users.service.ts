import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, MemberType } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByProvider(provider: string, providerId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { provider, providerId } });
  }

  async create(data: Partial<User>): Promise<User> {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  async updatePushToken(userId: string, pushToken: string): Promise<void> {
    await this.userRepo.update(userId, { pushToken });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userRepo.update(userId, { password: hashedPassword });
  }

  async updateProfile(
    userId: string,
    data: {
      nickname?: string;
      phone?: string;
      profileImage?: string;
      bankName?: string;
      accountNumber?: string;
      accountHolder?: string;
    },
  ): Promise<User> {
    await this.userRepo.update(userId, data);
    return this.findById(userId);
  }

  async getAllUsers(page = 1, limit = 20, keyword?: string) {
    const qb = this.userRepo.createQueryBuilder('u');

    if (keyword) {
      qb.where('LOWER(u.email) LIKE LOWER(:kw) OR LOWER(u.nickname) LIKE LOWER(:kw)', {
        kw: `%${keyword}%`,
      });
    }

    const [items, total] = await qb
      .orderBy('u.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map(({ password, ...rest }) => rest),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async setRole(userId: string, role: string): Promise<void> {
    await this.userRepo.update(userId, { role });
  }

  // === 3단계 회원체계 메서드 ===

  async validateParent(memberType: MemberType, parentId: string): Promise<void> {
    const parent = await this.userRepo.findOne({ where: { id: parentId } });
    if (!parent) {
      throw new BadRequestException('상위 회원을 찾을 수 없습니다');
    }

    if (memberType === MemberType.PARTNER && parent.memberType !== MemberType.ASSOCIATION) {
      throw new BadRequestException('파트너는 협회만 상위 회원으로 선택할 수 있습니다');
    }

    if (memberType === MemberType.USER && parent.memberType !== MemberType.PARTNER) {
      throw new BadRequestException('일반회원은 파트너만 상위 회원으로 선택할 수 있습니다');
    }
  }

  async changeParent(userId: string, newParentId: string | undefined): Promise<User> {
    const user = await this.findById(userId);

    if (newParentId) {
      await this.validateParent(user.memberType, newParentId);
    }

    await this.userRepo.update(userId, { parentId: newParentId || undefined });
    return this.findById(userId);
  }

  async getAssociations(): Promise<User[]> {
    return this.userRepo.find({
      where: { memberType: MemberType.ASSOCIATION, associationActive: true },
      select: ['id', 'associationName', 'businessNumber', 'nickname', 'profileImage'],
      order: { associationName: 'ASC' },
    });
  }

  async getPartners(associationId?: string): Promise<User[]> {
    const where: any = { memberType: MemberType.PARTNER };
    if (associationId) {
      where.parentId = associationId;
    }

    return this.userRepo.find({
      where,
      select: ['id', 'businessName', 'businessCategory', 'businessAddress', 'nickname', 'profileImage', 'parentId'],
      order: { businessName: 'ASC' },
    });
  }

  async getChildren(userId: string): Promise<User[]> {
    return this.userRepo.find({
      where: { parentId: userId },
      select: ['id', 'nickname', 'email', 'memberType', 'businessName', 'createdAt'],
      order: { createdAt: 'DESC' },
    });
  }

  async getMemberStats(userId: string): Promise<{ totalChildren: number; totalGrandChildren?: number }> {
    const user = await this.findById(userId);
    const children = await this.userRepo.count({ where: { parentId: userId } });

    if (user.memberType === MemberType.ASSOCIATION) {
      // 협회: 소속 파트너 수 + 전체 일반회원 수
      const partnerIds = await this.userRepo.find({
        where: { parentId: userId },
        select: ['id'],
      });
      let grandChildren = 0;
      for (const p of partnerIds) {
        grandChildren += await this.userRepo.count({ where: { parentId: p.id } });
      }
      return { totalChildren: children, totalGrandChildren: grandChildren };
    }

    return { totalChildren: children };
  }

  async updateBalance(userId: string, amount: number): Promise<void> {
    await this.userRepo.increment({ id: userId }, 'cashbackBalance', amount);
    if (amount > 0) {
      await this.userRepo.increment({ id: userId }, 'totalEarned', amount);
    }
  }

  async deductBalance(userId: string, amount: number): Promise<void> {
    await this.userRepo.decrement({ id: userId }, 'cashbackBalance', amount);
    await this.userRepo.increment({ id: userId }, 'totalWithdrawn', amount);
  }

  // === 번개장터 전용 포인트 (인출 불가, 번개장터에서만 사용) ===
  async addMarketPoint(userId: string, amount: number): Promise<void> {
    if (!(amount > 0)) return;
    await this.userRepo.increment({ id: userId }, 'marketPointBalance', amount);
  }

  async spendMarketPoint(userId: string, amount: number): Promise<void> {
    if (!(amount > 0)) return;
    await this.userRepo.decrement({ id: userId }, 'marketPointBalance', amount);
  }
}
