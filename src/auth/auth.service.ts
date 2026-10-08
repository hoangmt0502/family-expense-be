import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email này đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        fullName: dto.fullName,
        avatar: dto.avatar,
        role: dto.role,
      },
    });

    // User mới chưa có family
    const token = this.generateToken(user.id, user.email, user.role, null);

    return {
      message: 'Đăng ký tài khoản thành công',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        hasFamily: false,
        family: null, // Trả về null cho user mới
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    // Query lấy User đồng thời include thông tin Family
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        family: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const familyId = user.familyId || user.family?.id || null;
    const hasFamily = Boolean(familyId);

    // Mã hóa cả familyId vào JWT Token
    const token = this.generateToken(user.id, user.email, user.role, familyId);

    return {
      message: 'Đăng nhập thành công',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        avatar: user.avatar,
        role: user.role,
        hasFamily,
        family: user.family || null, // Trả về object family cho Frontend
        createdAt: user.createdAt,
      },
      accessToken: token,
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // 1. Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác!');
    }

    // 2. Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // 3. Lưu vào DB
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Đổi mật khẩu thành công!' };
  }

  private generateToken(
    userId: string,
    email: string,
    role?: string,
    familyId?: string | null,
  ): string {
    const payload = { sub: userId, email, role, familyId };
    return this.jwtService.sign(payload);
  }
}
