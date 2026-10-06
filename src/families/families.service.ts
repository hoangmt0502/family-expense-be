import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFamilyDto } from './dto/create-family.dto.js';
import { randomBytes } from 'crypto';
import { CategoriesService } from '../categories/categories.service.js';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  // Hàm sinh mã mời (Invite Code) ngẫu nhiên 6 ký tự dạng chữ/số
  private generateInviteCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  async create(dto: CreateFamilyDto, userId: string) {
    const inviteCode = this.generateInviteCode();

    const family = await this.prisma.family.create({
      data: {
        name: dto.name,
        inviteCode,
        members: {
          connect: [{ id: userId }],
        },
      },
      include: {
        members: {
          select: { id: true, fullName: true, email: true, avatar: true, role: true },
        },
      },
    });

    // Sinh ngay bộ danh mục mặc định cho gia đình vừa tạo
    await this.categoriesService.createDefaultCategories(family.id);

    return family;
  }

  async findMyFamilies(userId: string) {
    return this.prisma.family.findMany({
      where: {
        members: {
          some: { id: userId },
        },
      },
      include: {
        members: {
          select: { id: true, fullName: true, email: true, avatar: true, role: true },
        },
      },
    });
  }

  // Phương thức cho phép thành viên tham gia gia đình qua inviteCode
  async joinByInviteCode(inviteCode: string, userId: string) {
    const family = await this.prisma.family.findUnique({
      where: { inviteCode },
    });

    if (!family) {
      throw new BadRequestException('Mã mời không tồn tại');
    }

    return this.prisma.family.update({
      where: { id: family.id },
      data: {
        members: {
          connect: [{ id: userId }],
        },
      },
      include: {
        members: {
          select: { id: true, fullName: true, email: true, avatar: true, role: true },
        },
      },
    });
  }
}
