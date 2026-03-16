// backend/src/modules/overtime/dto/fairness-report.dto.ts
import { IsUUID, IsOptional, IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class FairnessReportDto {
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsNumber()
  @Min(1)
  @IsOptional()
  threshold?: number = 35; // Hours threshold for "high hours"
}

export class StaffHoursDto {
  userId: string;
  userName: string;
  totalHours: number;
  shiftCount: number;
  premiumShiftCount: number;
  averageShiftLength: number;
  desiredHours: number;
  hoursVariance: number;
  riskLevel: 'UNDER' | 'TARGET' | 'OVER';
}

export class PremiumShiftDto {
  id: string;
  title: string;
  date: Date;
  location: string;
  assignedTo: string;
  isPremium: boolean;
  multiplier?: number;
}

export class FairnessReportResponseDto {
  period: {
    startDate: Date;
    endDate: Date;
  };
  summary: {
    totalStaff: number;
    averageHours: number;
    medianHours: number;
    stdDevHours: number;
    giniCoefficient: number;
    mostUnderScheduled: StaffHoursDto[];
    mostOverScheduled: StaffHoursDto[];
  };
  distribution: {
    labels: string[];
    data: number[];
  };
  premiumShiftDistribution: {
    staffName: string;
    premiumShifts: number;
    totalShifts: number;
    ratio: number;
  }[];
  recommendations: string[];
  timestamp: Date;
}