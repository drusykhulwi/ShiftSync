// backend/src/modules/users/dto/create-user.dto.ts
import { 
  IsEmail, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsEnum, 
  IsArray, 
  IsNumber,
  Min,
  Max 
} from 'class-validator';
import { Role } from '../../../common/constants/roles.constants';

export class CreateUserDto {
  @IsEmail({}, { message: 'Please provide a valid email' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(['ADMIN', 'MANAGER', 'STAFF'], { message: 'Invalid role' })
  role: Role;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(168)
  desiredHours?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  locationIds?: string[]; // For managers - which locations they manage

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  certificationIds?: string[]; // For staff - initial certifications
}