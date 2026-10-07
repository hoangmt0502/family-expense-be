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
  BadRequestException,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('transactions')
@UseGuards(JwtAuthGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  async findMine(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const familyId = req.user?.familyId;
    if (!familyId) {
      throw new BadRequestException('Tài khoản chưa thuộc gia đình nào');
    }

    return this.transactionsService.findByFamily(
      familyId,
      month ? parseInt(month) : undefined,
      year ? parseInt(year) : undefined,
      categoryId,
    );
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateTransactionDto) {
    const userId = req.user.id;
    const familyId = req.user.familyId;

    if (!familyId) {
      throw new BadRequestException('Tài khoản chưa thuộc gia đình nào');
    }

    return this.transactionsService.create(userId, familyId, dto);
  }

  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
  ) {
    const familyId = req.user.familyId;
    return this.transactionsService.update(id, familyId, dto);
  }

  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const familyId = req.user.familyId;
    return this.transactionsService.remove(id, familyId);
  }
}
