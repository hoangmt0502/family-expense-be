import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBudgetDto {
  @IsNotEmpty({ message: 'Số tiền hạn mức không được để trống' })
  @Type(() => Number)
  @IsNumber()
  @Min(0, { message: 'Số tiền phải lớn hơn hoặc bằng 0' })
  amount: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(2020)
  year: number;

  @IsNotEmpty()
  @IsString()
  familyId: string;

  @IsNotEmpty()
  @IsString()
  categoryId: string;
}
