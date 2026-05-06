import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HomeBlock } from './entities/home-block.entity';
import { Mall } from './entities/mall.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class BlocksService {
  constructor(
    @InjectRepository(HomeBlock)
    private readonly blockRepo: Repository<HomeBlock>,
    @InjectRepository(Mall)
    private readonly mallRepo: Repository<Mall>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  // === 블록 CRUD ===

  async getActiveBlocks(): Promise<HomeBlock[]> {
    return this.blockRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getAllBlocks(): Promise<HomeBlock[]> {
    return this.blockRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async createBlock(data: Partial<HomeBlock>): Promise<HomeBlock> {
    const block = this.blockRepo.create(data);
    return this.blockRepo.save(block);
  }

  async updateBlock(id: string, data: Partial<HomeBlock>): Promise<HomeBlock> {
    await this.blockRepo.update(id, data);
    const block = await this.blockRepo.findOne({ where: { id } });
    if (!block) throw new NotFoundException('블록을 찾을 수 없습니다');
    return block;
  }

  async deleteBlock(id: string): Promise<void> {
    await this.blockRepo.delete(id);
  }

  async reorderBlocks(ids: string[]): Promise<void> {
    for (let i = 0; i < ids.length; i++) {
      await this.blockRepo.update(ids[i], { sortOrder: i });
    }
  }

  // === 쇼핑몰 CRUD ===

  async getActiveMalls(): Promise<Mall[]> {
    return this.mallRepo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getAllMalls(): Promise<Mall[]> {
    return this.mallRepo.find({ order: { sortOrder: 'ASC' } });
  }

  async getMallByPlatform(platform: string): Promise<Mall> {
    const mall = await this.mallRepo.findOne({ where: { platform } });
    if (!mall) throw new NotFoundException('쇼핑몰을 찾을 수 없습니다');
    return mall;
  }

  async createMall(data: Partial<Mall>): Promise<Mall> {
    const mall = this.mallRepo.create(data);
    return this.mallRepo.save(mall);
  }

  async updateMall(id: string, data: Partial<Mall>): Promise<Mall> {
    await this.mallRepo.update(id, data);
    const mall = await this.mallRepo.findOne({ where: { id } });
    if (!mall) throw new NotFoundException('쇼핑몰을 찾을 수 없습니다');
    return mall;
  }

  // === 홈 화면 데이터 조합 ===

  async getHomeData(): Promise<{
    blocks: any[];
    malls: Mall[];
  }> {
    const [blocks, malls] = await Promise.all([
      this.getActiveBlocks(),
      this.getActiveMalls(),
    ]);

    const enrichedBlocks = await Promise.all(
      blocks.map(async (block) => {
        const enriched: any = { ...block };

        if (block.blockType === 'topic_products' || block.blockType === 'mall_products') {
          const where: any = { isActive: true };
          if (block.config.category) where.category = block.config.category;
          if (block.config.platform) where.platform = block.config.platform;

          enriched.products = await this.productRepo.find({
            where,
            order: { createdAt: 'DESC' },
            take: block.config.maxItems || 6,
          });
        }

        return enriched;
      }),
    );

    return { blocks: enrichedBlocks, malls };
  }
}
