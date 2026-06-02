import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MarketService } from './market.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';
import { OrderStatus } from './entities/market-order.entity';

@Controller('market')
export class MarketController {
  constructor(private readonly marketService: MarketService) {}

  // === Public ===

  @Get()
  async getMarketHome() {
    const data = await this.marketService.getMarketHome();
    return { success: true, data };
  }

  // 정적 경로(products, categories)를 :id 보다 먼저 선언해 라우트 충돌 방지.
  @Get('categories')
  async getCategories() {
    const data = await this.marketService.getCategories();
    return { success: true, data };
  }

  @Get('products')
  async listProducts(
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.marketService.listProducts(
      category,
      keyword,
      page ? Number(page) : 1,
      limit ? Number(limit) : 30,
    );
    return { success: true, data };
  }

  @Get('products/:id')
  async getProduct(@Param('id') id: string) {
    const data = await this.marketService.getProduct(id);
    return { success: true, data };
  }

  @Get('exhibitions/:id')
  async getExhibition(@Param('id') id: string) {
    const data = await this.marketService.getExhibition(id);
    return { success: true, data };
  }

  @Get('category/:category')
  async getByCategory(
    @Param('category') category: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.marketService.getProductsByCategory(
      category,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return { success: true, data };
  }

  // === 주문 (로그인 필요) ===

  @UseGuards(JwtAuthGuard)
  @Post('orders')
  async createOrder(@Request() req, @Body() dto: any) {
    const data = await this.marketService.createOrder(req.user.id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  async getMyOrders(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.marketService.getMyOrders(
      req.user.id,
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders/:id')
  async getOrder(@Request() req, @Param('id') id: string) {
    const data = await this.marketService.getOrder(id, req.user.id);
    return { success: true, data };
  }

  // === Admin ===

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/products')
  async createProduct(@Body() dto: any) {
    const data = await this.marketService.createProduct(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/products/:id')
  async updateProduct(@Param('id') id: string, @Body() dto: any) {
    const data = await this.marketService.updateProduct(id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/exhibitions')
  async createExhibition(@Body() dto: any) {
    const data = await this.marketService.createExhibition(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/exhibitions/:id')
  async updateExhibition(@Param('id') id: string, @Body() dto: any) {
    const data = await this.marketService.updateExhibition(id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/orders/:id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: { status: OrderStatus; trackingNumber?: string },
  ) {
    const data = await this.marketService.updateOrderStatus(id, dto.status, dto.trackingNumber);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/orders')
  async getAllOrders(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const data = await this.marketService.getAllOrders(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      status,
    );
    return { success: true, data };
  }
}
