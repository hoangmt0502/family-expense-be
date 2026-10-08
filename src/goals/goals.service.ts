import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateGoalDto, DepositGoalDto } from './dto/goal.dto.js';

@Injectable()
export class GoalsService {
  constructor(private prisma: PrismaService) {}

  // Lấy danh sách mục tiêu của gia đình
  async findAll(familyId: string) {
    const goals = await this.prisma.goal.findMany({
      where: { familyId },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g) => ({
      ...g,
      targetAmount: Number(g.targetAmount),
      currentAmount: Number(g.currentAmount),
    }));
  }

  // Tạo mục tiêu mới
  async create(familyId: string, dto: CreateGoalDto) {
    return this.prisma.goal.create({
      data: {
        title: dto.title,
        emoji: dto.emoji || '🎯',
        targetAmount: dto.targetAmount,
        barColor: dto.barColor || 'from-purple-600 to-indigo-400',
        familyId,
      },
    });
  }

  // Cập nhật mục tiêu
  async update(id: string, familyId: string, dto: any) {
    const goal = await this.prisma.goal.findFirst({ where: { id, familyId } });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu');

    const updatedGoal = await this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.emoji && { emoji: dto.emoji }),
        ...(dto.targetAmount && { targetAmount: dto.targetAmount }),
        ...(dto.barColor && { barColor: dto.barColor }),
        ...(dto.deadline !== undefined && { deadline: dto.deadline }),
      },
    });

    return {
      ...updatedGoal,
      targetAmount: Number(updatedGoal.targetAmount),
      currentAmount: Number(updatedGoal.currentAmount),
    };
  }

  // Xóa mục tiêu
  async remove(id: string, familyId: string) {
    return this.prisma.goal.deleteMany({
      where: { id, familyId },
    });
  }

  // 1. Nạp tiền vào quỹ
  async deposit(id: string, familyId: string, userId: string, amount: number, note?: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id, familyId } });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu');

    const [updatedGoal] = await this.prisma.$transaction([
      this.prisma.goal.update({
        where: { id },
        data: { currentAmount: { increment: amount } },
      }),
      this.prisma.goalLog.create({
        data: { goalId: id, userId, amount, type: 'DEPOSIT', note: note || 'Nạp tiền tích lũy' },
      }),
    ]);

    return updatedGoal;
  }

  // 2. Rút tiền khỏi quỹ
  async withdraw(id: string, familyId: string, userId: string, amount: number, note?: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id, familyId } });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu');

    if (Number(goal.currentAmount) < amount) {
      throw new BadRequestException('Số tiền rút vượt quá số dư tích lũy hiện tại!');
    }

    const [updatedGoal] = await this.prisma.$transaction([
      this.prisma.goal.update({
        where: { id },
        data: { currentAmount: { decrement: amount } },
      }),
      this.prisma.goalLog.create({
        data: { goalId: id, userId, amount, type: 'WITHDRAW', note: note || 'Rút tiền từ quỹ' },
      }),
    ]);

    return updatedGoal;
  }

  // 3. Xem lịch sử nạp/rút tiền của 1 mục tiêu
  async getLogs(goalId: string, familyId: string) {
    const goal = await this.prisma.goal.findFirst({ where: { id: goalId, familyId } });
    if (!goal) throw new NotFoundException('Không tìm thấy mục tiêu');

    const logs = await this.prisma.goalLog.findMany({
      where: { goalId },
      include: { user: { select: { fullName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      ...log,
      amount: Number(log.amount),
    }));
  }

  // 4. Xóa 1 dòng lịch sử (Tự động hạch toán hoàn trả số tiền)
  async deleteLog(logId: string, familyId: string) {
    const log = await this.prisma.goalLog.findUnique({
      where: { id: logId },
      include: { goal: true },
    });

    if (!log || log.goal.familyId !== familyId) {
      throw new NotFoundException('Không tìm thấy lịch sử giao dịch');
    }

    const amount = Number(log.amount);
    // Nếu xóa lịch sử NẠP -> Giảm currentAmount; Xóa lịch sử RÚT -> Tăng currentAmount
    const updateData = log.type === 'DEPOSIT' 
      ? { decrement: amount } 
      : { increment: amount };

    await this.prisma.$transaction([
      this.prisma.goal.update({
        where: { id: log.goalId },
        data: { currentAmount: updateData },
      }),
      this.prisma.goalLog.delete({ where: { id: logId } }),
    ]);

    return { message: 'Đã xóa lịch sử giao dịch thành công' };
  }
}
