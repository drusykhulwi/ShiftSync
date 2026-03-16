// backend/src/common/filters/websocket-exception.filter.ts
import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch()
export class WebsocketExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WebsocketExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const event = host.switchToWs().getPattern();

    let errorResponse: any;

    if (exception instanceof WsException) {
      errorResponse = {
        event,
        success: false,
        error: {
          message: exception.message,
          ...(process.env.NODE_ENV === 'development' && { stack: exception.stack }),
        },
        timestamp: new Date().toISOString(),
      };
    } else {
      const error = exception as Error;
      errorResponse = {
        event,
        success: false,
        error: {
          message: 'Internal server error',
          ...(process.env.NODE_ENV === 'development' && { 
            stack: error.stack,
            name: error.name 
          }),
        },
        timestamp: new Date().toISOString(),
      };

      this.logger.error(
        `WebSocket error on event "${event}": ${error.stack || error.message}`
      );
    }

    client.emit('error', errorResponse);
  }
}