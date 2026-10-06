import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryBudgetDto {
  @IsNotEmpty()
  @IsString()
  familyId: string;

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
}
