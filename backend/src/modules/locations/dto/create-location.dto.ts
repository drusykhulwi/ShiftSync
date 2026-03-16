// backend/src/modules/locations/dto/create-location.dto.ts
import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsPhoneNumber,
  IsBoolean,
  IsObject 
} from 'class-validator';

export class CreateLocationDto {
  @IsString()
  name: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  zipCode: string;

  @IsString()
  country: string = 'USA';

  @IsString()
  timezone: string; // IANA timezone (e.g., 'America/Los_Angeles')

  @IsPhoneNumber()
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}