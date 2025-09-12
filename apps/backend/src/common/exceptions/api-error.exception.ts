import { HttpException, HttpStatus } from '@nestjs/common';

export class ApiError extends HttpException {
  constructor(
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: unknown,
  ) {
    super(
      {
        message,
        error: HttpStatus[statusCode],
        details,
      },
      statusCode,
    );
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(message, HttpStatus.BAD_REQUEST, details);
  }

  static unauthorized(
    message: string = 'Unauthorized',
    details?: unknown,
  ): ApiError {
    return new ApiError(message, HttpStatus.UNAUTHORIZED, details);
  }

  static forbidden(message: string = 'Forbidden', details?: unknown): ApiError {
    return new ApiError(message, HttpStatus.FORBIDDEN, details);
  }

  static notFound(message: string = 'Not Found', details?: unknown): ApiError {
    return new ApiError(message, HttpStatus.NOT_FOUND, details);
  }

  static internal(
    message: string = 'Internal Server Error',
    details?: unknown,
  ): ApiError {
    return new ApiError(message, HttpStatus.INTERNAL_SERVER_ERROR, details);
  }
}
