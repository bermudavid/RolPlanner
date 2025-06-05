import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { UserRole } from '../../user/user.entity';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
