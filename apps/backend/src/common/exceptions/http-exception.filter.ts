import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ExceptionResponse {
  message: string | string[];
  error?: string;
  details?: unknown;
}

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  response: ExceptionResponse;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.getStatus(exception);
    const errorResponse = this.getErrorResponse(exception, request, status);

    // Log the error
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error',
      'ExceptionFilter',
    );

    response.status(status).json(errorResponse);
  }

  private getStatus(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private getErrorResponse(
    exception: unknown,
    request: Request,
    status: number,
  ): ErrorResponse {
    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      response: {
        message: 'Internal server error',
      },
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse() as
        | string
        | ExceptionResponse;
      errorResponse.response = {
        message:
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exceptionResponse.message || exception.message,
        error:
          typeof exceptionResponse === 'string'
            ? undefined
            : exceptionResponse.error,
        details:
          typeof exceptionResponse === 'string'
            ? undefined
            : exceptionResponse.details,
      };
    } else if (exception instanceof Error) {
      errorResponse.response.message = exception.message;
    }

    return errorResponse;
  }
}
