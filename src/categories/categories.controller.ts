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
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService } from './categories.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // Lấy danh sách danh mục thuộc gia đình người dùng đang đăng nhập
  @Get()
  async findMine(@Request() req: any) {
    const familyId = req.user?.familyId;
    return this.categoriesService.findByFamily(familyId);
  }

  // Tạo danh mục mới
  @Post()
  async create(@Request() req: any, @Body() dto: CreateCategoryDto) {
    const familyId = req.user?.familyId;
    if (!familyId) {
      throw new BadRequestException('Tài khoản chưa thuộc gia đình nào');
    }
    return this.categoriesService.create(familyId, dto);
  }

  // Cập nhật danh mục
  @Patch(':id')
  async update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const familyId = req.user?.familyId;
    return this.categoriesService.update(id, familyId, dto);
  }

  // Xóa danh mục
  @Delete(':id')
  async remove(@Request() req: any, @Param('id') id: string) {
    const familyId = req.user?.familyId;
    return this.categoriesService.remove(id, familyId);
  }
}
