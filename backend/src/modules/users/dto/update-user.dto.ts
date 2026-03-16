// backend/src/modules/users/dto/update-user.dto.ts
import { 
  IsEmail, 
  IsString, 
  IsOptional, 
  IsEnum, 
  IsNumber,
  Min,
  Max,
  IsBoolean 
} from 'class-validator';
import { Role } from '../../../common/constants/roles.constants';

export class UpdateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['ADMIN', 'MANAGER', 'STAFF'])
  @IsOptional()
  role?: Role;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(168)
  desiredHours?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}