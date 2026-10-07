import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh mục mặc định của hệ thống + danh mục riêng của gia đình
  async findByFamily(familyId: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ familyId: null }, { familyId }],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tạo mới danh mục (dto đã bao gồm icon và/hoặc imageUrl nếu có)
  async create(familyId: string, dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...dto,
        familyId,
      },
    });
  }

  // Cập nhật danh mục
  async update(id: string, familyId: string, dto: UpdateCategoryDto) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    if (category.familyId !== familyId) {
      throw new ForbiddenException(
        'Bạn không có quyền chỉnh sửa danh mục này',
      );
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  // Xóa danh mục
  async remove(id: string, familyId: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục');
    }

    if (category.familyId !== familyId) {
      throw new ForbiddenException('Bạn không có quyền xóa danh mục này');
    }

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
