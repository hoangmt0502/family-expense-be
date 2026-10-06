import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateBudgetDto } from './dto/create-budget.dto.js';
import { QueryBudgetDto } from './dto/query-budget.dto.js';

@Injectable()
export class BudgetsService {
  constructor(private readonly prisma: PrismaService) {}

  // Thiết lập hoặc cập nhật ngân sách (Upsert)
  async setBudget(dto: CreateBudgetDto) {
    return this.prisma.budget.upsert({
      where: {
        familyId_categoryId_month_year: {
          familyId: dto.familyId,
          categoryId: dto.categoryId,
          month: dto.month,
          year: dto.year,
        },
      },
      update: {
        amount: dto.amount,
      },
      create: {
        amount: dto.amount,
        month: dto.month,
        year: dto.year,
        familyId: dto.familyId,
        categoryId: dto.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  // Lấy danh sách ngân sách kèm tính toán chi tiêu thực tế trong tháng
  async getBudgetsWithProgress(query: QueryBudgetDto) {
    const { familyId, month, year } = query;

    // 1. Lấy danh sách hạn mức ngân sách đã tạo
    const budgets = await this.prisma.budget.findMany({
      where: { familyId, month, year },
      include: { category: true },
    });

    // Xác định khoảng thời gian đầu tháng và cuối tháng
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // 2. Gom nhóm tổng số tiền đã chi tiêu theo danh mục trong tháng
    const expensesGrouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        familyId,
        type: 'EXPENSE',
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    // Tạo bản đồ ánh xạ categoryId -> tổng chi tiêu
    const expenseMap = new Map<string, number>();
    expensesGrouped.forEach((item) => {
      expenseMap.set(item.categoryId, Number(item._sum.amount || 0));
    });

    // 3. Kết hợp ngân sách với tiến độ chi tiêu thực tế
    return budgets.map((b) => {
      const budgetAmount = Number(b.amount);
      const spentAmount = expenseMap.get(b.categoryId) || 0;
      const remainingAmount = budgetAmount - spentAmount;
      const percentage = budgetAmount > 0 ? Math.min(Math.round((spentAmount / budgetAmount) * 100), 100) : 0;

      return {
        id: b.id,
        categoryId: b.categoryId,
        categoryName: b.category.name,
        categoryIcon: b.category.icon,
        budgetAmount,
        spentAmount,
        remainingAmount,
        percentage,
        isExceeded: spentAmount > budgetAmount,
      };
    });
  }
}
