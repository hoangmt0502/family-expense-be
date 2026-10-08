import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getStats(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
    return this.dashboardService.getStats(req.user.familyId, +month, +year);
  }

  @Get('category-budgets')
  getCategoryBudgets(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
    return this.dashboardService.getCategoryBudgets(req.user.familyId, +month, +year);
  }

  // API riêng cho biểu đồ, nhận query filter
  @Get('chart')
  getChartData(
    @Req() req: any,
    @Query('filter') filter: 'month' | 'year' = 'month',
  ) {
    return this.dashboardService.getChartData(req.user.familyId, filter);
  }

  @Get('recent-transactions')
  getRecentTransactions(@Req() req: any) {
    return this.dashboardService.getRecentTransactions(req.user.familyId);
  }

  @Get('spending-breakdown')
  getSpendingBreakdown(@Req() req: any, @Query('month') month: string, @Query('year') year: string) {
    return this.dashboardService.getSpendingBreakdown(req.user.familyId, +month, +year);
  }
}
