import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { UpdateRoleDto } from './dto/update-role.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('profile')
  async updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Get('family-members')
  async getFamilyMembers(@Request() req: any) {
    return this.usersService.getFamilyMembers(req.user.id);
  }

  @Patch('family-members/:id/role')
  async updateMemberRole(
    @Request() req: any,
    @Param('id') targetUserId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.usersService.updateMemberRole(req.user.id, targetUserId, dto.role);
  }

  @Delete('family-members/:id')
  async removeMemberFromFamily(
    @Request() req: any,
    @Param('id') targetUserId: string,
  ) {
    return this.usersService.removeMemberFromFamily(req.user.id, targetUserId);
  }
}
