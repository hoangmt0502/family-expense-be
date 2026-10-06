import { IsNotEmpty, IsString } from 'class-validator';

export class CreateFamilyDto {
  @IsNotEmpty({ message: 'Tên gia đình không được để trống' })
  @IsString()
  name: string;
}
