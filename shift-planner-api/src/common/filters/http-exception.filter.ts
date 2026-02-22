import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponse {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const isProd = process.env.NODE_ENV === 'production';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_ERROR';
    let message = 'Beklenmeyen bir hata oluştu';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const resp = exceptionResponse as any;
        message = resp.message || exception.message;
        code = resp.code || this.getCodeFromStatus(status);
        details = resp.details || resp.errors;

        // class-validator errors
        if (Array.isArray(resp.message)) {
          details = resp.message;
          message = 'Validasyon hatası';
          code = 'VALIDATION_ERROR';
        }
      }
      if (isProd && status >= 500) {
        message = 'Beklenmeyen bir hata oluştu';
        details = undefined;
        code = this.getCodeFromStatus(status);
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );
      message = isProd ? 'Beklenmeyen bir hata oluştu' : exception.message;
      if (isProd) {
        details = undefined;
      }
    }

    const errorResponse: ErrorResponse = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).json(errorResponse);
  }

  private getCodeFromStatus(status: number): string {
    const codeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
    };
    return codeMap[status] || 'INTERNAL_ERROR';
  }
}
