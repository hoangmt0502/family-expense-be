import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@prisma/client';

export class UpdateRoleDto {
  @IsNotEmpty()
  @IsEnum(Role, { message: 'Vai trò phải là ADMIN hoặc MEMBER' })
  role: Role;
}
