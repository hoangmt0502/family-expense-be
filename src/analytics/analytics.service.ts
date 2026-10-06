import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { QueryAnalyticsDto, QueryTrendDto } from './dto/query-analytics.dto.js';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Thống kê tổng quan Thu - Chi - Số dư tháng hiện tại & so sánh với tháng trước
  async getOverview(query: QueryAnalyticsDto) {
    const { familyId, month, year } = query;

    // Khoảng thời gian tháng hiện tại
    const currentStart = new Date(year, month - 1, 1);
    const currentEnd = new Date(year, month, 0, 23, 59, 59, 999);

    // Khoảng thời gian tháng trước
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStart = new Date(prevYear, prevMonth - 1, 1);
    const prevEnd = new Date(prevYear, prevMonth, 0, 23, 59, 59, 999);

    // Tính tổng thu/chi tháng hiện tại
    const currentStats = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        familyId,
        date: { gte: currentStart, lte: currentEnd },
      },
      _sum: { amount: true },
    });

    // Tính tổng thu/chi tháng trước
    const prevStats = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: {
        familyId,
        date: { gte: prevStart, lte: prevEnd },
      },
      _sum: { amount: true },
    });

    const getAmount = (stats: typeof currentStats, type: 'INCOME' | 'EXPENSE') => {
      const found = stats.find((s) => s.type === type);
      return Number(found?._sum.amount || 0);
    };

    const totalIncome = getAmount(currentStats, 'INCOME');
    const totalExpense = getAmount(currentStats, 'EXPENSE');
    const balance = totalIncome - totalExpense;

    const prevIncome = getAmount(prevStats, 'INCOME');
    const prevExpense = getAmount(prevStats, 'EXPENSE');

    // Tính % thay đổi so với tháng trước
    const calcChange = (current: number, prev: number) => {
      if (prev === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - prev) / prev) * 100);
    };

    return {
      month,
      year,
      totalIncome,
      totalExpense,
      balance,
      comparisonWithLastMonth: {
        incomeChangePercent: calcChange(totalIncome, prevIncome),
        expenseChangePercent: calcChange(totalExpense, prevExpense),
      },
    };
  }

  // 2. Phân tích tỷ trọng chi tiêu theo từng danh mục
  async getCategoryBreakdown(query: QueryAnalyticsDto) {
    const { familyId, month, year } = query;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Gom nhóm chi tiêu theo categoryId
    const grouped = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: {
        familyId,
        type: 'EXPENSE',
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    const totalExpense = grouped.reduce(
      (sum, item) => sum + Number(item._sum.amount || 0),
      0,
    );

    if (grouped.length === 0) {
      return { totalExpense: 0, categories: [] };
    }

    // Lấy thông tin danh mục tương ứng
    const categoryIds = grouped.map((g) => g.categoryId);
    const categoriesInfo = await this.prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = new Map(categoriesInfo.map((c) => [c.id, c]));

    const categories = grouped
      .map((item) => {
        const cat = categoryMap.get(item.categoryId);
        const amount = Number(item._sum.amount || 0);
        const percentage = totalExpense > 0 ? Number(((amount / totalExpense) * 100).toFixed(1)) : 0;

        return {
          categoryId: item.categoryId,
          categoryName: cat?.name || 'Chưa phân loại',
          categoryIcon: cat?.icon || 'tag',
          amount,
          transactionCount: item._count.id,
          percentage,
        };
      })
      .sort((a, b) => b.amount - a.amount); // Sắp xếp từ lớn đến nhỏ

    return {
      totalExpense,
      categories,
    };
  }

  // 3. Báo cáo xu hướng Thu - Chi theo N tháng gần nhất
  async getMonthlyTrend(query: QueryTrendDto) {
    const { familyId, limitMonths = 6 } = query;
    const now = new Date();
    const result: Array<{ month: number; year: number; income: number; expense: number }> = [];

    for (let i = limitMonths - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0, 23, 59, 59, 999);

      const stats = await this.prisma.transaction.groupBy({
        by: ['type'],
        where: {
          familyId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      });

      const income = Number(stats.find((s) => s.type === 'INCOME')?._sum.amount || 0);
      const expense = Number(stats.find((s) => s.type === 'EXPENSE')?._sum.amount || 0);

      result.push({
        month: m,
        year: y,
        income,
        expense,
      });
    }

    return result;
  }
}
