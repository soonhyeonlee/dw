import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Banner } from './entities/banner.entity';

@Injectable()
export class BannersService {
  constructor(
    @InjectRepository(Banner)
    private readonly repo: Repository<Banner>,
  ) {}

  // 모바일 공개: 활성 배너만, 정렬순.
  async getActive(placement: string): Promise<Banner[]> {
    return this.repo.find({
      where: { placement, isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  // 어드민: 전체(비활성 포함). placement 지정 시 필터.
  async getAll(placement?: string): Promise<Banner[]> {
    return this.repo.find({
      where: placement ? { placement } : {},
      order: { placement: 'ASC', sortOrder: 'ASC', createdAt: 'ASC' },
    });
  }

  async create(data: Partial<Banner>): Promise<Banner> {
    const banner = this.repo.create(data);
    return this.repo.save(banner);
  }

  async update(id: string, data: Partial<Banner>): Promise<Banner> {
    await this.repo.update(id, data);
    const banner = await this.repo.findOne({ where: { id } });
    if (!banner) throw new NotFoundException('배너를 찾을 수 없습니다');
    return banner;
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async reorder(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.repo.update(ids[i], { sortOrder: i });
    }
  }
}
