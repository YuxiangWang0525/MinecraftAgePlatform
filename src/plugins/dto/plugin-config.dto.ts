import { IsBoolean, IsOptional, IsString, IsObject } from 'class-validator';

export class SetPluginEnabledDto {
  @IsBoolean()
  enabled: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}

export class SetPluginDescriptionDto {
  @IsString()
  description: string;
}

export class SetPluginConfigValuesDto {
  @IsObject()
  configValues: Record<string, string>;
}
