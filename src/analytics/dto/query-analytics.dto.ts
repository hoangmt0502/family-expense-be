import { IsNotEmpty, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryAnalyticsDto {
  @IsNotEmpty({ message: 'familyId không được để trống' })
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

export class QueryTrendDto {
  @IsNotEmpty()
  @IsString()
  familyId: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(3)
  @Max(12)
  limitMonths?: number = 6;
}
