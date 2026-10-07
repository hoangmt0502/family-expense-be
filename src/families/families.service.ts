import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateFamilyDto } from './dto/create-family.dto.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';
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

    const family = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { role: Role.HOST },
      });

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

  // ==================== BỔ SUNG CÁC HÀM QUẢN LÝ THÀNH VIÊN ====================

  // 1. Lấy thông tin gia đình hiện tại kèm danh sách thành viên đầy đủ
  async getFamilyMembers(userId: string) {
    const family = await this.prisma.family.findFirst({
      where: {
        members: {
          some: { id: userId },
        },
      },
      include: {
        members: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });

    if (!family) {
      throw new NotFoundException('Không tìm thấy thông tin gia đình');
    }

    return family;
  }

  // 2. Cập nhật vai trò (Role) của thành viên - Chỉ HOST/ADMIN mới có quyền thực hiện
  async updateMemberRole(
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    currentUserId: string,
  ) {
    const family = await this.prisma.family.findFirst({
      where: {
        members: {
          some: { id: currentUserId },
        },
      },
      include: { members: true },
    });

    if (!family) {
      throw new NotFoundException('Không tìm thấy thông tin gia đình');
    }

    // Kiểm tra xem người gọi API có phải HOST hoặc ADMIN không
    const currentUser = family.members.find((m) => m.id === currentUserId);
    if (currentUser?.role !== Role.HOST && currentUser?.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Chủ hộ mới có quyền thay đổi vai trò thành viên');
    }

    // Không cho phép tự đổi quyền của chính mình qua endpoint này
    if (targetUserId === currentUserId) {
      throw new BadRequestException('Bạn không thể tự thay đổi vai trò của chính mình');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: dto.role },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
        role: true,
      },
    });
  }

  // 3. Rời gia đình / Xóa thành viên khỏi gia đình
  async removeMember(targetUserId: string, currentUserId: string) {
    const family = await this.prisma.family.findFirst({
      where: {
        members: {
          some: { id: currentUserId },
        },
      },
      include: { members: true },
    });

    if (!family) {
      throw new NotFoundException('Không tìm thấy thông tin gia đình');
    }

    const isSelf = targetUserId === currentUserId;
    const currentUser = family.members.find((m) => m.id === currentUserId);

    // Nếu không phải tự thoát nhóm, bắt buộc phải là HOST mới được xóa người khác
    if (!isSelf && currentUser?.role !== Role.HOST && currentUser?.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Chủ hộ mới có quyền xóa thành viên khỏi gia đình');
    }

    // Ngắt kết nối User với Family và gán lại role MEMBER mặc định
    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        familyId: null,
        role: Role.MEMBER,
      },
    });

    return {
      message: isSelf ? 'Đã rời gia đình thành công' : 'Đã xóa thành viên khỏi gia đình',
    };
  }
}
