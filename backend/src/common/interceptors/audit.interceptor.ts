// backend/src/common/interceptors/audit.interceptor.ts
import { 
  Injectable, 
  NestInterceptor, 
  ExecutionContext, 
  CallHandler,
  Logger 
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const user = req.user;
    const now = Date.now();

    // Extract entity info from request
    const entityType = this.getEntityType(url);
    const entityId = req.params.id || req.body.id;

    // Store original request body for before state
    const beforeState = method === 'PATCH' || method === 'PUT' ? req.body : null;

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - now;
          
          // Log to audit
          if (this.shouldAudit(method, url)) {
            const action = this.mapMethodToAction(method);
            
            this.auditService.log({
              actorId: user?.id,
              action,
              entityType,
              entityId: entityId || data?.id,
              beforeState: beforeState || undefined,
              afterState: data,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            }).catch(err => this.logger.error('Failed to create audit log', err));
          }

          this.logger.debug(`${method} ${url} - ${responseTime}ms`);
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          this.logger.error(`${method} ${url} - ${responseTime}ms - Error: ${error.message}`);
        },
      }),
    );
  }

  private shouldAudit(method: string, url: string): boolean {
    // Don't audit GET requests
    if (method === 'GET') return false;
    
    // Don't audit auth endpoints
    if (url.includes('/auth/')) return false;
    
    // Don't audit health checks
    if (url.includes('/health')) return false;
    
    return true;
  }

  private mapMethodToAction(method: string): AuditAction {
    switch (method) {
      case 'POST': return AuditAction.CREATE;
      case 'PATCH':
      case 'PUT': return AuditAction.UPDATE;
      case 'DELETE': return AuditAction.DELETE;
      default: return AuditAction.UPDATE;
    }
  }

  private getEntityType(url: string): string {
    // Extract entity type from URL (e.g., /users/123 -> users)
    const parts = url.split('/');
    return parts[1] || 'unknown';
  }
}