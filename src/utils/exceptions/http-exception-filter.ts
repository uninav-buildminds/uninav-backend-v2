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
    let responseDto = ResponseDto.createErrorResponse(exception.message, {
      cause: exception.cause,
      name: exception.name,
      path: request.url,
      statusCode: status,
    });
    response.status(status).json(responseDto);
  }
}
