import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { TransactionType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class CreateTransactionDto {
  @IsNumber({}, { message: 'Số tiền phải là số hợp lệ' })
  @Min(1, { message: 'Số tiền phải lớn hơn 0' })
  @Type(() => Number)
  amount: number;

  @IsEnum(TransactionType, { message: 'Loại giao dịch không hợp lệ' })
  type: TransactionType;

  @IsString({ message: 'Danh mục không hợp lệ' })
  @IsNotEmpty({ message: 'Vui lòng chọn danh mục' })
  categoryId: string;

  @IsString()
  @IsOptional()
  note?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  imageUrl?: string;

  @IsOptional()
  @Type(() => Date)
  date?: Date;
}
