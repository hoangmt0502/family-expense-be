import { Controller, Get, Post, Body, Param, Delete, Req, UseGuards, Patch } from '@nestjs/common';
import { GoalsService } from './goals.service.js';
import { CreateGoalDto, DepositGoalDto } from './dto/goal.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Get()
  findAll(@Req() req: any) {
    return this.goalsService.findAll(req.user.familyId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateGoalDto) {
    return this.goalsService.create(req.user.familyId, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() body: any) {
    return this.goalsService.update(id, req.user.familyId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.remove(id, req.user.familyId);
  }

  @Post(':id/deposit')
  deposit(@Param('id') id: string, @Req() req: any, @Body() body: { amount: number; note?: string }) {
    return this.goalsService.deposit(id, req.user.familyId, req.user.id, body.amount, body.note);
  }

  @Post(':id/withdraw')
  withdraw(@Param('id') id: string, @Req() req: any, @Body() body: { amount: number; note?: string }) {
    return this.goalsService.withdraw(id, req.user.familyId, req.user.id, body.amount, body.note);
  }

  @Get(':id/logs')
  getLogs(@Param('id') id: string, @Req() req: any) {
    return this.goalsService.getLogs(id, req.user.familyId);
  }

  @Delete('logs/:logId')
  deleteLog(@Param('logId') logId: string, @Req() req: any) {
    return this.goalsService.deleteLog(logId, req.user.familyId);
  }
}
