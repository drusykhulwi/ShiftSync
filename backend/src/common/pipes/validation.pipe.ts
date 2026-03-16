// backend/src/common/pipes/validation.pipe.ts
import { 
  PipeTransform, 
  Injectable, 
  ArgumentMetadata, 
  BadRequestException,
  Type 
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { ERROR_CODES } from '../constants/error-codes.constants';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

    if (errors.length > 0) {
      const formattedErrors = this.formatErrors(errors);
      
      throw new BadRequestException({
        success: false,
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: 'Validation failed',
          details: formattedErrors,
        },
        timestamp: new Date().toISOString(),
      });
    }

    return object;
  }

  private toValidate(metatype: Type<any>): boolean {
    const types: Type<any>[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]) {
    const result: Record<string, string[]> = {};

    errors.forEach(error => {
      const property = error.property;
      const constraints = error.constraints;
      
      if (constraints) {
        result[property] = Object.values(constraints);
      }

      // Handle nested validation
      if (error.children && error.children.length > 0) {
        const nestedErrors = this.formatErrors(error.children);
        Object.keys(nestedErrors).forEach(key => {
          result[`${property}.${key}`] = nestedErrors[key];
        });
      }
    });

    return result;
  }
}