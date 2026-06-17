import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode = this.getStatusCode(exception);
    const payload =
      exception instanceof HttpException ? exception.getResponse() : undefined;

    response.status(statusCode).json({
      statusCode,
      message: this.getMessage(exception, payload),
      error:
        statusCode === HttpStatus.INTERNAL_SERVER_ERROR
          ? 'Internal Server Error'
          : HttpStatus[statusCode],
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private getMessage(exception: unknown, payload: unknown) {
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      return (payload as { message: unknown }).message;
    }

    if (typeof payload === 'string') {
      return payload;
    }

    return exception instanceof Error ? exception.message : 'Unexpected error';
  }

  private getStatusCode(exception: unknown) {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        return HttpStatus.CONFLICT;
      }

      if (exception.code === 'P2003') {
        return HttpStatus.BAD_REQUEST;
      }

      if (exception.code === 'P2025') {
        return HttpStatus.NOT_FOUND;
      }
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
