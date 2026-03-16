// backend/src/modules/overtime/dto/overtime-report.dto.ts
import { IsUUID, IsDate, IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum ReportPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  QUARTER = 'QUARTER',
  YEAR = 'YEAR',
}

export class OvertimeReportDto {
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsDate()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  endDate: Date;

  @IsEnum(ReportPeriod)
  @IsOptional()
  groupBy?: ReportPeriod = ReportPeriod.WEEK;
}

export class OvertimeSummaryDto {
  userId: string;
  userName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  doubleOvertimeHours?: number;
  overtimeCost: number;
  warnings: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class OvertimeReportResponseDto {
  period: {
    startDate: Date;
    endDate: Date;
    groupBy: string;
  };
  summary: {
    totalEmployees: number;
    employeesWithOvertime: number;
    totalOvertimeHours: number;
    totalOvertimeCost: number;
    projectedOvertimeCost: number;
  };
  details: OvertimeSummaryDto[];
  chartData: {
    labels: string[];
    datasets: {
      regular: number[];
      overtime: number[];
    };
  };
  timestamp: Date;
}