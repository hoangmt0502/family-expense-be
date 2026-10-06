import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FamiliesService } from './families.service.js';
import { CreateFamilyDto } from './dto/create-family.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

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
}
