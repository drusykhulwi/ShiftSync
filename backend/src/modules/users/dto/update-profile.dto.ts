// backend/src/modules/users/dto/update-profile.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsNumber,
  Min,
  Max,
  IsObject 
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(168)
  desiredHours?: number;

  @IsObject()
  @IsOptional()
  notificationPrefs?: {
    inApp?: boolean;
    email?: boolean;
    push?: boolean;
  };
}