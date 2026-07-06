import { Controller, Get, Query } from '@nestjs/common';
import { MomCafeService } from './momcafe.service';

@Controller('momcafes')
export class MomCafeController {
  constructor(private readonly momCafeService: MomCafeService) {}

  @Get()
  getMomCafes(
    @Query('region') region?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const data = this.momCafeService.getMomCafes({
      region,
      q,
      limit: limit ? Number(limit) : undefined,
    });
    return { success: true, data };
  }
}
