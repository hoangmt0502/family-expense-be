import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TransactionsService } from './transactions.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UploadedFileDto } from '../cloudinary/cloudinary.service.js';

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('receipt'))
  async create(
    @Body() dto: CreateTransactionDto,
    @UploadedFile() file?: UploadedFileDto,
  ) {
    return this.transactionsService.create(dto, file);
  }

  @Get('family/:familyId')
  async findAllByFamily(@Param('familyId') familyId: string) {
    return this.transactionsService.findAllByFamily(familyId);
  }
}
