// backend/src/common/decorators/location-access.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const LOCATION_ACCESS_KEY = 'locationAccess';
export const LOCATION_ID_PARAM = 'locationId';

export interface LocationAccessOptions {
  param?: string; // which param contains locationId (default: 'locationId')
  body?: string;  // which body field contains locationId
  required?: boolean; // whether location access is required (default: true)
}

export const LocationAccess = (options: LocationAccessOptions = {}) => 
  SetMetadata(LOCATION_ACCESS_KEY, options);