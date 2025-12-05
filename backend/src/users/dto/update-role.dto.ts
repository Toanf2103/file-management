import { IsEnum } from 'class-validator';
import { UserRole } from '../../common/interfaces/user.interface';

export class UpdateRoleDto {
  @IsEnum(UserRole)
  role: UserRole;
}

