import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFamilyDto } from './dto/create-family.dto.js';
import { randomBytes } from 'crypto';
import { CategoriesService } from '../categories/categories.service.js';
import { Role } from '@prisma/client';

@Injectable()
export class FamiliesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly categoriesService: CategoriesService,
  ) {}

  private generateInviteCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  async create(dto: CreateFamilyDto, userId: string) {
    const inviteCode = this.generateInviteCode();

    // Dùng transaction để vừa tạo Family vừa cập nhật role = HOST cho người tạo
    const family = await this.prisma.$transaction(async (tx) => {
      // 1. Cập nhật role người tạo thành HOST
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.HOST },
      });

      // 2. Tạo Family
      const createdFamily = await tx.family.create({
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

      return createdFamily;
    });

    // 3. Sinh danh mục mặc định
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

  // BỔ SUNG: Lấy thông tin Family hiện tại của User
  async getCurrentFamily(userId: string) {
    const family = await this.prisma.family.findFirst({
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

    if (!family) {
      throw new NotFoundException('Bạn chưa tham gia gia đình nào');
    }

    return family;
  }

  async joinByInviteCode(inviteCode: string, userId: string) {
    const family = await this.prisma.family.findUnique({
      where: { inviteCode },
      include: { members: true },
    });

    if (!family) {
      throw new BadRequestException('Mã mời không tồn tại');
    }

    // Kiểm tra xem user đã thuộc gia đình này chưa
    const isAlreadyMember = family.members.some((m) => m.id === userId);
    if (isAlreadyMember) {
      throw new BadRequestException('Bạn đã là thành viên của gia đình này');
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
