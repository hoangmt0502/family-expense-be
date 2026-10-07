import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TransactionType } from '@prisma/client';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên danh mục không được để trống' })
  name: string;

  @IsEnum(TransactionType, { message: 'Loại danh mục không hợp lệ' })
  @IsOptional()
  type?: TransactionType;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
