import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(
    @Query('platform') platform?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.productsService.findAll({
      platform,
      category,
      keyword,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { success: true, data };
  }

  // 주의: ':id' 라우트보다 위에 둬야 'categories' 가 id 로 잡히지 않음.
  @Get('categories')
  async getCategories(@Query('platform') platform?: string) {
    const data = await this.productsService.getCategories(platform);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/wishlist')
  async getWishlist(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.productsService.getWishlist(
      req.user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('user/recent')
  async getRecentlyViewed(@Request() req) {
    const data = await this.productsService.getRecentlyViewed(req.user.id);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.productsService.findById(id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/click')
  async logClick(@Param('id') id: string, @Request() req) {
    const log = await this.productsService.logClick(req.user.id, id);
    return {
      success: true,
      data: { affiliateUrl: log.affiliateUrl },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/wishlist')
  async toggleWishlist(@Param('id') id: string, @Request() req) {
    const data = await this.productsService.toggleWishlist(req.user.id, id);
    return { success: true, data };
  }

  // === 관심 쇼핑몰 ===

  @UseGuards(JwtAuthGuard)
  @Get('user/mall-wishlist')
  async getMallWishlist(@Request() req) {
    const data = await this.productsService.getMallWishlist(req.user.id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('mall/:mallId/wishlist')
  async toggleMallWishlist(@Param('mallId') mallId: string, @Request() req) {
    const data = await this.productsService.toggleMallWishlist(req.user.id, mallId);
    return { success: true, data };
  }

  // === Admin CRUD ===

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/all')
  async adminFindAll(
    @Query('platform') platform?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.productsService.adminFindAll({
      platform,
      category,
      keyword,
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post()
  async create(@Body() body: any) {
    const data = await this.productsService.create(body);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    const data = await this.productsService.update(id, body);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.productsService.remove(id);
    return { success: true };
  }
}
