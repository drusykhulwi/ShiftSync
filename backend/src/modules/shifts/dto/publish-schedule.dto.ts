// backend/src/modules/shifts/dto/publish-schedule.dto.ts
import { IsArray, IsDate, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class PublishScheduleDto {
  @IsArray()
  @IsString({ each: true })
  shiftIds: string[];

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  publishDate?: Date;

  @IsString()
  @IsOptional()
  message?: string;
}