import { IsNumber, IsString, IsNotEmpty, Min, Max } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @Min(1)
  @Max(12)
  @IsNotEmpty()
  month: number;

  @IsNumber()
  @Min(2000)
  @IsNotEmpty()
  year: number;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}

export class UpdateBudgetDto {
  @IsNumber()
  @Min(1)
  amount: number;
}
