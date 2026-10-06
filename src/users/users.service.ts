import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy thông tin tài khoản hiện tại
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        familyId: true,
        family: {
          select: {
            id: true,
            name: true,
            inviteCode: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    return user;
  }

  // Cập nhật thông tin cá nhân
  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName && { fullName: dto.fullName }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        familyId: true,
      },
    });
  }

  // Lấy danh sách thành viên trong gia đình của user hiện tại
  async getFamilyMembers(userId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { familyId: true },
    });

    if (!currentUser?.familyId) {
      throw new BadRequestException('Bạn chưa tham gia gia đình nào');
    }

    return this.prisma.user.findMany({
      where: { familyId: currentUser.familyId },
      select: {
        id: true,
        email: true,
        fullName: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
      orderBy: { role: 'asc' },
    });
  }

  // Thay đổi vai trò của thành viên trong gia đình (Chỉ ADMIN)
  async updateMemberRole(adminUserId: string, targetUserId: string, newRole: Role) {
    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { familyId: true, role: true },
    });

    if (!admin?.familyId || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ ADMIN gia đình mới có quyền thay đổi vai trò');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { familyId: true },
    });

    if (!targetUser || targetUser.familyId !== admin.familyId) {
      throw new NotFoundException('Thành viên không thuộc gia đình của bạn');
    }

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
      },
    });
  }

  // Xóa/Mời thành viên ra khỏi gia đình (Chỉ ADMIN)
  async removeMemberFromFamily(adminUserId: string, targetUserId: string) {
    if (adminUserId === targetUserId) {
      throw new BadRequestException('Bạn không thể tự xóa chính mình khỏi gia đình bằng chức năng này');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: adminUserId },
      select: { familyId: true, role: true },
    });

    if (!admin?.familyId || admin.role !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ ADMIN gia đình mới có quyền xóa thành viên');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { familyId: true },
    });

    if (!targetUser || targetUser.familyId !== admin.familyId) {
      throw new NotFoundException('Thành viên không thuộc gia đình của bạn');
    }

    await this.prisma.user.update({
      where: { id: targetUserId },
      data: {
        familyId: null,
        role: Role.MEMBER,
      },
    });

    return { message: 'Đã xóa thành viên khỏi gia đình thành công' };
  }
}
