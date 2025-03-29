import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ResponseDto } from 'src/utils/globalDto/response.dto';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    let message =
      typeof (exception.getResponse() as any).message === 'string'
        ? (exception.getResponse() as any).message
        : (exception.getResponse() as any).message.length > 0
          ? (exception.getResponse() as any).message[0]
          : exception.message;
    let responseDto = ResponseDto.createErrorResponse(message, {
      cause: exception.cause || exception.message,
      name: exception.name,
      path: request.url,
      statusCode: status,
    });
    console.log(responseDto, exception);
    response.status(status).json(responseDto);
  }
}
