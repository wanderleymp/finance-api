import { IsString, IsUrl, validateSync } from 'class-validator';
import { plainToClass } from 'class-transformer';

export class FileStorageConfig {
  @IsUrl()
  MINIO_DOMAIN: string;

  @IsUrl()
  S3_DOMAIN: string;

  @IsString()
  ACCESS_KEY: string;

  @IsString()
  SECRET_KEY: string;
}

export function validateFileStorageConfig(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(FileStorageConfig, config, { 
    enableImplicitConversion: true 
  });

  const errors = validateSync(validatedConfig, { 
    skipMissingProperties: false 
  });

  if (errors.length > 0) {
    throw new Error(`Configuração de armazenamento de arquivos inválida: ${errors.toString()}`);
  }

  return validatedConfig;
}
