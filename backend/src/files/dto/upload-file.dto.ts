import { IsEnum, IsOptional, IsArray, IsString } from 'class-validator';
import { FileVisibility } from '../schemas/file.schema';

export class UploadFileDto {
  @IsEnum(FileVisibility)
  visibility: FileVisibility;

  @IsArray()
  @IsOptional()
  sharedWith?: string[];

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  parentFolderId?: string;
}

