import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { QueryBudgetDto } from './dto/query-budget.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Post()
  async setBudget(@Body() dto: CreateBudgetDto) {
    return this.budgetsService.setBudget(dto);
  }

  @Get('progress')
  async getBudgetsWithProgress(@Query() query: QueryBudgetDto) {
    return this.budgetsService.getBudgetsWithProgress(query);
  }
}
