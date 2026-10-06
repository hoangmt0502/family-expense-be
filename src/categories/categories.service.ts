import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { TransactionType } from '@prisma/client';

export const DEFAULT_CATEGORIES = [
  // Chi tiêu (EXPENSE)
  { name: 'Ăn uống', type: TransactionType.EXPENSE, icon: 'utensils' },
  { name: 'Đi lại & Xăng xe', type: TransactionType.EXPENSE, icon: 'car' },
  { name: 'Mua sắm & Hóa đơn', type: TransactionType.EXPENSE, icon: 'shopping-bag' },
  { name: 'Giải trí & Du lịch', type: TransactionType.EXPENSE, icon: 'gamepad' },
  { name: 'Y tế & Sức khỏe', type: TransactionType.EXPENSE, icon: 'heart-pulse' },
  { name: 'Giáo dục & Học tập', type: TransactionType.EXPENSE, icon: 'graduation-cap' },
  // Thu nhập (INCOME)
  { name: 'Lương & Thưởng', type: TransactionType.INCOME, icon: 'wallet' },
  { name: 'Đầu tư & Lãi', type: TransactionType.INCOME, icon: 'chart-line' },
  { name: 'Thu nhập khác', type: TransactionType.INCOME, icon: 'coins' },
];

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  // Tự động sinh danh mục mặc định cho gia đình mới
  async createDefaultCategories(familyId: string) {
    const data = DEFAULT_CATEGORIES.map((cat) => ({
      ...cat,
      familyId,
    }));

    return this.prisma.category.createMany({
      data,
    });
  }

  // Tạo danh mục tùy chỉnh
  async create(dto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        name: dto.name,
        type: dto.type,
        icon: dto.icon,
        familyId: dto.familyId,
      },
    });
  }

  // Lấy danh sách danh mục của 1 gia đình
  async findByFamily(familyId: string) {
    return this.prisma.category.findMany({
      where: { familyId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
