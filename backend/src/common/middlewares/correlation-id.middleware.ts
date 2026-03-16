// backend/src/common/middlewares/correlation-id.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers[CORRELATION_ID_HEADER.toLowerCase()] as string || uuidv4();
    
    // Add to request
    req.correlationId = correlationId;
    
    // Add to response headers
    res.setHeader(CORRELATION_ID_HEADER, correlationId);
    
    next();
  }
}