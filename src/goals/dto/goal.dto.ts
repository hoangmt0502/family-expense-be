import { IsString, IsNumber, IsOptional, Min } from 'class-validator';

export class CreateGoalDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  emoji?: string;

  @IsNumber()
  @Min(1000)
  targetAmount: number;

  @IsString()
  @IsOptional()
  barColor?: string;
}

export class DepositGoalDto {
  @IsNumber()
  @Min(1000)
  amount: number;
}
