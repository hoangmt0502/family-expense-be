import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service.js';
import { QueryAnalyticsDto, QueryTrendDto } from './dto/query-analytics.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  async getOverview(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getOverview(query);
  }

  @Get('category-breakdown')
  async getCategoryBreakdown(@Query() query: QueryAnalyticsDto) {
    return this.analyticsService.getCategoryBreakdown(query);
  }

  @Get('monthly-trend')
  async getMonthlyTrend(@Query() query: QueryTrendDto) {
    return this.analyticsService.getMonthlyTrend(query);
  }
}
