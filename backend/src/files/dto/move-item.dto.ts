import { IsString, IsOptional } from 'class-validator';

export class MoveItemDto {
  @IsString()
  @IsOptional()
  targetFolderId?: string; // null means move to root
}

