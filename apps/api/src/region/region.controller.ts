import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { RegionService } from './region.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AdminGuard } from '../common/guards/admin.guard';

@Controller('region')
export class RegionController {
  constructor(private readonly regionService: RegionService) {}

  // === 학원 ===

  @Get('academies')
  async getAcademies(
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('lat') lat?: string,
    @Query('lng') lng?: string,
    @Query('radiusKm') radiusKm?: string,
    @Query('source') source?: 'manual' | 'google_maps',
    @Query('sort') sort?: 'popular' | 'rating' | 'review' | 'distance',
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.regionService.getAcademies({
      region, category, keyword, source, sort,
      lat: lat != null ? Number(lat) : undefined,
      lng: lng != null ? Number(lng) : undefined,
      radiusKm: radiusKm != null ? Number(radiusKm) : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { success: true, data };
  }

  @Get('academies/:id')
  async getAcademy(@Param('id') id: string) {
    const data = await this.regionService.getAcademy(id);
    return { success: true, data };
  }

  // 사진 프록시: Google Place Photo(IP 제한 키, 서버에서만 호출) → googleusercontent 로 302
  @Get('academies/:id/photo/:idx')
  async academyPhoto(
    @Param('id') id: string,
    @Param('idx') idx: string,
    @Query('w') w: string,
    @Res() res: Response,
  ) {
    const url = await this.regionService.resolvePhotoUrl(id, Number(idx), w ? Number(w) : 800);
    if (!url) {
      res.status(404).send();
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.redirect(302, url);
  }

  // 거리뷰 프록시: 사진 없는 업체를 그 업체 위치의 Google Street View 사진으로 채운다.
  // (없으면 관련 유튜브 영상 썸네일로 302) — 키가 IP 제한이라 서버에서만 호출 가능해 바이트 스트리밍.
  @Get('academies/:id/streetview')
  async academyStreetView(@Param('id') id: string, @Res() res: Response) {
    const r = await this.regionService.resolveStreetView(id);
    if (!r) {
      res.status(404).send();
      return;
    }
    if (r.redirect) {
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.redirect(302, r.redirect);
      return;
    }
    // 거리뷰 이미지는 자주 안 바뀌므로 길게 캐시(CloudFront/클라이언트). 비용도 절감.
    res.setHeader('Content-Type', r.contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800');
    res.send(r.body);
  }

  @UseGuards(JwtAuthGuard)
  @Post('academies/:id/heart')
  async toggleHeart(@Param('id') id: string, @Body('increment') increment: boolean) {
    await this.regionService.toggleHeart(id, increment);
    return { success: true };
  }

  // === 리뷰 ===

  @Get('academies/:id/reviews')
  async getReviews(
    @Param('id') id: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.regionService.getReviews(id, page ? Number(page) : 1, limit ? Number(limit) : 20);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('academies/:id/reviews')
  async createReview(
    @Request() req,
    @Param('id') academyId: string,
    @Body() dto: { rating: number; content: string; photos?: string[]; isMomCafe?: boolean },
  ) {
    const data = await this.regionService.createReview(req.user.id, { ...dto, academyId });
    return { success: true, data };
  }

  // === 쿠폰 ===

  @Get('coupons')
  async getCoupons(
    @Query('category') category?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.regionService.getCoupons({
      category,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('coupons/:id/download')
  async downloadCoupon(@Request() req, @Param('id') id: string) {
    const data = await this.regionService.downloadCoupon(req.user.id, id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-coupons')
  async getMyCoupons(@Request() req) {
    const data = await this.regionService.getMyCoupons(req.user.id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('my-coupons/:id/use')
  async useCoupon(@Request() req, @Param('id') id: string) {
    const data = await this.regionService.useCoupon(req.user.id, id);
    return { success: true, data };
  }

  // === 파트너용 ===

  @UseGuards(JwtAuthGuard)
  @Post('partner/academies')
  async createAcademy(@Request() req, @Body() dto: any) {
    const data = await this.regionService.createAcademy(req.user.id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('partner/academies/:id')
  async updateAcademy(@Request() req, @Param('id') id: string, @Body() dto: any) {
    const data = await this.regionService.updateAcademy(id, req.user.id, dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Post('partner/coupons')
  async createCoupon(@Request() req, @Body() dto: any) {
    const data = await this.regionService.createCoupon(req.user.id, req.user.businessName || req.user.nickname, dto);
    return { success: true, data };
  }

  // === 어드민 CRUD: 학원 ===

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/academies')
  async adminListAcademies(
    @Query('region') region?: string,
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.regionService.adminListAcademies({
      region,
      category,
      keyword,
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/academies')
  async adminCreateAcademy(@Body() body: any) {
    const data = await this.regionService.adminCreateAcademy(body);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/academies/:id')
  async adminUpdateAcademy(@Param('id') id: string, @Body() body: any) {
    const data = await this.regionService.adminUpdateAcademy(id, body);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/academies/:id')
  async adminRemoveAcademy(@Param('id') id: string) {
    await this.regionService.adminRemoveAcademy(id);
    return { success: true };
  }

  // === 어드민 CRUD: 쿠폰 ===

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Get('admin/coupons')
  async adminListCoupons(
    @Query('category') category?: string,
    @Query('keyword') keyword?: string,
    @Query('isActive') isActive?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const data = await this.regionService.adminListCoupons({
      category,
      keyword,
      isActive: typeof isActive === 'string' ? isActive === 'true' : undefined,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Post('admin/coupons')
  async adminCreateCoupon(@Request() req, @Body() body: any) {
    const data = await this.regionService.adminCreateCoupon(req.user.id, body);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Patch('admin/coupons/:id')
  async adminUpdateCoupon(@Param('id') id: string, @Body() body: any) {
    const data = await this.regionService.adminUpdateCoupon(id, body);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, AdminGuard)
  @Delete('admin/coupons/:id')
  async adminRemoveCoupon(@Param('id') id: string) {
    await this.regionService.adminRemoveCoupon(id);
    return { success: true };
  }
}
