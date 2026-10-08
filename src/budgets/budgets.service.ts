import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBudgetDto, UpdateBudgetDto } from './dto/create-budget.dto.js';

@Injectable()
export class BudgetsService {
  constructor(private prisma: PrismaService) {}

  // 1. Lấy danh sách ngân sách theo tháng/năm + Tính thực tế đã chi (spent)
  async getBudgets(familyId: string, month: number, year: number) {
    const budgets = await this.prisma.budget.findMany({
      where: {
        familyId,
        month,
        year,
      },
      include: {
        category: true,
      },
    });

    // Lấy khoảng thời gian từ đầu tháng đến cuối tháng
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Tính tổng chi tiêu thực tế cho từng ngân sách
    const budgetsWithSpent = await Promise.all(
      budgets.map(async (budget) => {
        const result = await this.prisma.transaction.aggregate({
          _sum: {
            amount: true,
          },
          where: {
            familyId,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
        });

        return {
          ...budget,
          amount: Number(budget.amount),
          spent: Number(result._sum.amount || 0),
        };
      }),
    );

    return budgetsWithSpent;
  }

  // 2. Tạo ngân sách mới (Upsert hoặc throw conflict nếu trùng)
  async createBudget(familyId: string, dto: CreateBudgetDto) {
    const existing = await this.prisma.budget.findUnique({
      where: {
        familyId_categoryId_month_year: {
          familyId,
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Danh mục này đã được thiết lập ngân sách trong tháng!');
    }

    return this.prisma.budget.create({
      data: {
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
        categoryId: dto.categoryId,
        familyId,
      },
      include: {
        category: true,
      },
    });
  }

  // 3. Cập nhật hạn mức ngân sách
  async updateBudget(id: string, familyId: string, dto: UpdateBudgetDto) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, familyId },
    });

    if (!budget) {
      throw new NotFoundException('Không tìm thấy ngân sách');
    }

    return this.prisma.budget.update({
      where: { id },
      data: { amount: dto.amount },
      include: { category: true },
    });
  }

  // 4. Xóa ngân sách
  async deleteBudget(id: string, familyId: string) {
    const budget = await this.prisma.budget.findFirst({
      where: { id, familyId },
    });

    if (!budget) {
      throw new NotFoundException('Không tìm thấy ngân sách');
    }

    return this.prisma.budget.delete({
      where: { id },
    });
  }
}
