import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Tạo danh mục mới
  @Post()
  async create(@Request() req: any, @Body() dto: CreateCategoryDto) {
    const familyId = req.user.familyId;
    return this.categoriesService.create(familyId, dto);
  }

  // Lấy danh sách danh mục theo familyId
  @Get('family/:familyId')
  async findByFamily(@Param('familyId') familyId: string) {
    return this.categoriesService.findByFamily(familyId);
  }

  // Cập nhật danh mục
  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const familyId = req.user.familyId;
    return this.categoriesService.update(id, familyId, dto);
  }

  // Xóa danh mục
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const familyId = req.user.familyId;
    return this.categoriesService.remove(id, familyId);
  }
}
