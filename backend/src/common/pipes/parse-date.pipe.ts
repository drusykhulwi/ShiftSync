// backend/src/common/pipes/parse-date.pipe.ts
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { ERROR_CODES } from '../constants/error-codes.constants';

@Injectable()
export class ParseDatePipe implements PipeTransform<string, Date> {
  constructor(private readonly fieldName?: string) {}

  transform(value: string): Date {
    if (!value) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_INPUT,
          message: `${this.fieldName || 'Date'} is required`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.INVALID_INPUT,
          message: `${this.fieldName || 'Date'} must be a valid ISO date string`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return date;
  }
}