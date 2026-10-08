import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTransactionDto } from './dto/create-transaction.dto.js';
import { UpdateTransactionDto } from './dto/update-transaction.dto.js';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy danh sách giao dịch của Gia đình (có bộ lọc Theo Tháng/Năm hoặc Category)
  async findByFamily(
    familyId: string,
    month?: number,
    year?: number,
    categoryId?: string,
  ) {
    const whereCondition: any = { familyId };

    if (categoryId) {
      whereCondition.categoryId = categoryId;
    }

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      whereCondition.date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const transactions = await this.prisma.transaction.findMany({
      where: whereCondition,
      include: {
        category: true,
        user: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Thống kê tổng Thu & Chi (Chuyển Decimal sang number)
    const summary = transactions.reduce(
      (acc, t) => {
        const amountNum = Number(t.amount);
        if (t.type === 'INCOME') acc.totalIncome += amountNum;
        else acc.totalExpense += amountNum;
        return acc;
      },
      { totalIncome: 0, totalExpense: 0 },
    );

    return {
      summary: {
        totalIncome: summary.totalIncome,
        totalExpense: summary.totalExpense,
        balance: summary.totalIncome - summary.totalExpense,
      },
      data: transactions,
    };
  }

  // Tạo mới giao dịch
  async create(userId: string, familyId: string, dto: CreateTransactionDto) {
    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        note: dto.note,
        imageUrl: dto.imageUrl,
        date: dto.date ? new Date(dto.date) : new Date(),
        categoryId: dto.categoryId,
        familyId,
        userId,
      },
      include: {
        category: true,
        user: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
    });
  }

  // Cập nhật giao dịch
  async update(id: string, familyId: string, dto: UpdateTransactionDto) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    if (transaction.familyId !== familyId) {
      throw new ForbiddenException('Bạn không có quyền sửa giao dịch này');
    }

    return this.prisma.transaction.update({
      where: { id },
      data: {
        ...dto,
        date: dto.date ? new Date(dto.date) : undefined,
      },
      include: {
        category: true,
        user: {
          select: { id: true, fullName: true, avatar: true },
        },
      },
    });
  }

  // Xóa giao dịch
  async remove(id: string, familyId: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException('Không tìm thấy giao dịch');
    }

    if (transaction.familyId !== familyId) {
      throw new ForbiddenException('Bạn không có quyền xóa giao dịch này');
    }

    return this.prisma.transaction.delete({
      where: { id },
    });
  }

  async exportTransactionsCsv(familyId: string): Promise<string> {
    const transactions = await this.prisma.transaction.findMany({
      where: { familyId },
      include: {
        category: true,
        user: true,
      },
      orderBy: { date: 'desc' },
    });

    // Tạo Header cho CSV
    const headers = ['Mã Giao Dịch', 'Ngày', 'Loại', 'Danh Mục', 'Số Tiền (VNĐ)', 'Ghi Chú', 'Người Tạo'];
    const rows = transactions.map((t) => [
      `"${t.id}"`,
      `"${new Date(t.date).toLocaleDateString('vi-VN')}"`,
      `"${t.type === 'EXPENSE' ? 'Chi tiêu' : 'Thu nhập'}"`,
      `"${t.category?.name || 'Chưa phân loại'}"`,
      `"${Number(t.amount)}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`, // Escape dấu ngoặc kép
      `"${t.user?.fullName || ''}"`,
    ]);

    // Thêm UTF-8 BOM (\uFEFF) để Excel mở không bị lỗi font Tiếng Việt
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    return csvContent;
  }
}
