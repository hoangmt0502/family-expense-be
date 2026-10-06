import { Controller, Get, Post, Body, UseGuards, Request, Patch, Param, Delete } from '@nestjs/common';
import { FamiliesService } from './families.service.js';
import { CreateFamilyDto } from './dto/create-family.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto.js';

@Controller('families')
@UseGuards(JwtAuthGuard)
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  async create(@Body() dto: CreateFamilyDto, @Request() req: any) {
    return this.familiesService.create(dto, req.user.id);
  }

  @Get('current')
  async getCurrentFamily(@Request() req: any) {
    return this.familiesService.getCurrentFamily(req.user.id);
  }

  @Get('my-families')
  async findMyFamilies(@Request() req: any) {
    return this.familiesService.findMyFamilies(req.user.id);
  }

  @Post('join')
  async joinByInviteCode(@Body('inviteCode') inviteCode: string, @Request() req: any) {
    return this.familiesService.joinByInviteCode(inviteCode, req.user.id);
  }

  @Get('members')
  async getFamilyMembers(@Request() req: any) {
    return this.familiesService.getFamilyMembers(req.user.id);
  }

  @Patch('members/:memberId/role')
  async updateMemberRole(
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
    @Request() req: any,
  ) {
    return this.familiesService.updateMemberRole(memberId, dto, req.user.id);
  }

  @Delete('members/:memberId')
  async removeMember(
    @Param('memberId') memberId: string,
    @Request() req: any,
  ) {
    return this.familiesService.removeMember(memberId, req.user.id);
  }
}
