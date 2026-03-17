// frontend/src/types/analytics.types.ts
export interface OvertimeSummary {
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

export interface OvertimeReport {
  period: {
    startDate: string;
    endDate: string;
    groupBy: string;
  };
  summary: {
    totalEmployees: number;
    employeesWithOvertime: number;
    totalOvertimeHours: number;
    totalOvertimeCost: number;
    projectedOvertimeCost: number;
  };
  details: OvertimeSummary[];
  chartData: {
    labels: string[];
    datasets: {
      regular: number[];
      overtime: number[];
    };
  };
  timestamp: string;
}

export interface FairnessSummary {
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

export interface FairnessReport {
  period: {
    startDate: string;
    endDate: string;
  };
  summary: {
    totalStaff: number;
    averageHours: number;
    medianHours: number;
    stdDevHours: number;
    giniCoefficient: number;
    mostUnderScheduled: FairnessSummary[];
    mostOverScheduled: FairnessSummary[];
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
  timestamp: string;
}

export interface OvertimeProjection {
  period: {
    startDate: string;
    endDate: string;
  };
  current: {
    totalEmployees: number;
    employeesWithOvertime: number;
    totalOvertimeHours: number;
    totalOvertimeCost: number;
  };
  projected: {
    totalEmployees: number;
    employeesWithOvertime: number;
    totalOvertimeHours: number;
    totalOvertimeCost: number;
    confidence: number;
  };
  highRiskEmployees: string[];
  timestamp: string;
}

export interface OvertimeRisk {
  userId: string;
  name: string;
  projectedHours: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  warningThreshold: boolean;
  overtimeThreshold: boolean;
}

export interface DateRange {
  startDate: string;
  endDate: string;
}