import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  ageRange?: string;

  @IsBoolean()
  @IsOptional()
  isMinor?: boolean;
}
