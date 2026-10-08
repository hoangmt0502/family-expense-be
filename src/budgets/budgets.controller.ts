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
  Req,
} from '@nestjs/common';
import { BudgetsService } from './budgets.service.js';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('budgets')
@UseGuards(JwtAuthGuard)
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get()
  async getBudgets(
    @Req() req: any,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    const familyId = req.user.familyId;
    const m = month ? parseInt(month, 10) : new Date().getMonth() + 1;
    const y = year ? parseInt(year, 10) : new Date().getFullYear();

    return this.budgetsService.getBudgets(familyId, m, y);
  }

  @Post()
  async createBudget(@Req() req: any, @Body() dto: CreateBudgetDto) {
    const familyId = req.user.familyId;
    return this.budgetsService.createBudget(familyId, dto);
  }

  @Patch(':id')
  async updateBudget(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateBudgetDto,
  ) {
    const familyId = req.user.familyId;
    return this.budgetsService.updateBudget(id, familyId, dto);
  }

  @Delete(':id')
  async deleteBudget(@Req() req: any, @Param('id') id: string) {
    const familyId = req.user.familyId;
    return this.budgetsService.deleteBudget(id, familyId);
  }
}
