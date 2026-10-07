import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByFamily(familyId?: string) {
    return this.prisma.category.findMany({
      where: {
        OR: [{ familyId: null }, ...(familyId ? [{ familyId }] : [])],
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Tạo mới danh mục cho gia đình (Chống trùng tên)
  async create(familyId: string, dto: CreateCategoryDto) {
    const trimmedName = dto.name.trim();

    // Kiểm tra tên danh mục đã tồn tại trong hệ thống hoặc gia đình chưa
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        OR: [{ familyId: null }, { familyId }],
        name: {
          equals: trimmedName,
          mode: 'insensitive', // Không phân biệt chữ hoa / chữ thường
        },
      },
    });

    if (existingCategory) {
      throw new BadRequestException(
        `Danh mục "${trimmedName}" đã tồn tại trong hệ thống hoặc gia đình của bạn`,
      );
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        name: trimmedName,
        familyId,
      },
    });
  }

  // Cập nhật danh mục (Chống trùng tên)
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

    // Nếu người dùng có cập nhật tên danh mục
    if (dto.name) {
      const trimmedName = dto.name.trim();

      // Kiểm tra trùng tên với các danh mục khác (trừ chính nó)
      const duplicateCategory = await this.prisma.category.findFirst({
        where: {
          id: { not: id }, // Loại trừ bản ghi hiện tại
          OR: [{ familyId: null }, { familyId }],
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });

      if (duplicateCategory) {
        throw new BadRequestException(
          `Danh mục "${trimmedName}" đã tồn tại`,
        );
      }

      dto.name = trimmedName;
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
