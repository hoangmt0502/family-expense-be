import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // 1. Lấy Thống kê tổng quan (Thu, Chi, Số dư, Tổng Ngân sách)
  async getStats(familyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const incomeAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { familyId, type: 'INCOME', date: { gte: startDate, lte: endDate } },
    });

    const expenseAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { familyId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
    });

    const budgetAgg = await this.prisma.budget.aggregate({
      _sum: { amount: true },
      where: { familyId, month, year },
    });

    const totalIncome = Number(incomeAgg._sum.amount || 0);
    const totalExpense = Number(expenseAgg._sum.amount || 0);
    const totalBudget = Number(budgetAgg._sum.amount || 0);

    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
      totalBudget,
    };
  }

  // 2. Lấy dữ liệu Biểu đồ Thu/Chi (Có filter Theo Tháng / Theo Năm)
  async getChartData(familyId: string, filter: 'month' | 'year') {
    const now = new Date();
    const data = [];

    if (filter === 'month') {
      // Lấy 6 tháng gần nhất
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const m = d.getMonth() + 1;
        const y = d.getFullYear();
        const s = new Date(y, m - 1, 1);
        const e = new Date(y, m, 0, 23, 59, 59, 999);

        const inc = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { familyId, type: 'INCOME', date: { gte: s, lte: e } },
        });
        const exp = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { familyId, type: 'EXPENSE', date: { gte: s, lte: e } },
        });

        data.push({
          name: `T${m}/${y.toString().slice(2)}`,
          income: Number(inc._sum.amount || 0),
          expense: Number(exp._sum.amount || 0),
        });
      }
    } else if (filter === 'year') {
      // Lấy 3 năm gần nhất
      for (let i = 2; i >= 0; i--) {
        const y = now.getFullYear() - i;
        const s = new Date(y, 0, 1);
        const e = new Date(y, 11, 31, 23, 59, 59, 999);

        const inc = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { familyId, type: 'INCOME', date: { gte: s, lte: e } },
        });
        const exp = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { familyId, type: 'EXPENSE', date: { gte: s, lte: e } },
        });

        data.push({
          name: `Năm ${y}`,
          income: Number(inc._sum.amount || 0),
          expense: Number(exp._sum.amount || 0),
        });
      }
    }

    return data;
  }

  // 3. Lấy Tiến độ Ngân sách theo Danh mục (Top 4)
  async getCategoryBudgets(familyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const budgets = await this.prisma.budget.findMany({
      where: { familyId, month, year },
      include: { category: true },
      orderBy: { amount: 'desc' },
      take: 4, // Chỉ lấy Top 4 để hiển thị trên Dashboard
    });

    return Promise.all(
      budgets.map(async (b) => {
        const spentAgg = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: { familyId, categoryId: b.categoryId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
        });
        return {
          id: b.id,
          name: b.category.name,
          icon: b.category.icon,
          imageUrl: b.category.imageUrl,
          limit: Number(b.amount),
          spent: Number(spentAgg._sum.amount || 0),
        };
      }),
    );
  }

  // 4. Lấy 5 Giao dịch gần nhất
  async getRecentTransactions(familyId: string) {
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { familyId },
      include: { category: true, user: true },
      orderBy: { date: 'desc' },
      take: 5,
    });

    return recentTransactions.map((t) => ({
      id: t.id,
      amount: Number(t.amount),
      type: t.type,
      note: t.note,
      date: t.date,
      categoryName: t.category?.name || 'Giao dịch',
      categoryIcon: t.category?.icon,
      userName: t.user?.fullName,
    }));
  }

  // 5. Lấy Cơ cấu chi tiêu (Group by Category)
  async getSpendingBreakdown(familyId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const categoryExpenses = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      _sum: { amount: true },
      where: { familyId, type: 'EXPENSE', date: { gte: startDate, lte: endDate } },
    });

    const categories = await this.prisma.category.findMany({
      where: { id: { in: categoryExpenses.map((c) => c.categoryId) } },
    });

    return categoryExpenses.map((ce) => {
      const cat = categories.find((c) => c.id === ce.categoryId);
      return {
        id: ce.categoryId,
        name: cat?.name || 'Khác',
        amount: Number(ce._sum.amount || 0),
        icon: cat?.icon,
      };
    });
  }
}
