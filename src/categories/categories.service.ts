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

  // Tạo mới danh mục cho gia đình (Chống trùng tên TRONG CÙNG TYPE)
  async create(familyId: string, dto: CreateCategoryDto) {
    const trimmedName = dto.name.trim();

    // Kiểm tra tên danh mục đã tồn tại trong cùng TYPE (INCOME hoặc EXPENSE) chưa
    const existingCategory = await this.prisma.category.findFirst({
      where: {
        type: dto.type, // 👈 Bổ sung điều kiện cùng loại thu/chi
        OR: [{ familyId: null }, { familyId }],
        name: {
          equals: trimmedName,
          mode: 'insensitive',
        },
      },
    });

    if (existingCategory) {
      const typeLabel = dto.type === 'INCOME' ? 'Thu nhập' : 'Khoản chi';
      throw new BadRequestException(
        `Danh mục "${trimmedName}" (${typeLabel}) đã tồn tại trong hệ thống hoặc gia đình của bạn`,
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

  // Cập nhật danh mục (Chống trùng tên TRONG CÙNG TYPE)
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

    // Lấy type đích (dùng type mới từ dto nếu có, nếu không thì dùng type hiện tại của category)
    const targetType = dto.type || category.type;
    const trimmedName = dto.name ? dto.name.trim() : category.name;

    // Nếu có sự thay đổi về Tên hoặc Loại danh mục -> Cần kiểm tra trùng lặp
    if (dto.name || dto.type) {
      const duplicateCategory = await this.prisma.category.findFirst({
        where: {
          id: { not: id }, // Loại trừ bản ghi hiện tại
          type: targetType, // 👈 Kiểm tra trùng tên theo đúng type mới/hiện tại
          OR: [{ familyId: null }, { familyId }],
          name: {
            equals: trimmedName,
            mode: 'insensitive',
          },
        },
      });

      if (duplicateCategory) {
        const typeLabel = targetType === 'INCOME' ? 'Thu nhập' : 'Khoản chi';
        throw new BadRequestException(
          `Danh mục "${trimmedName}" (${typeLabel}) đã tồn tại`,
        );
      }
    }

    if (dto.name) {
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
