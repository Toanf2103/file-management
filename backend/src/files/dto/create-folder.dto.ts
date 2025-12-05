import { IsString, MinLength, IsOptional } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  parentFolderId?: string;
}

