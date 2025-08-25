import { ApiProperty } from '@nestjs/swagger';
import { ResponseStatus } from '../config/constants.config';

export class BaseResponseDto<T = any> {
  @ApiProperty({
    description: 'Response message',
    example: 'Operation completed successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Response status',
    enum: ResponseStatus,
    example: ResponseStatus.SUCCESS,
  })
  status: ResponseStatus;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T;

  @ApiProperty({
    type: 'object',
    description: 'Error details',
    // required: false,
    properties: {
      cause: { type: 'string' },
      name: { type: 'string' },
      path: { type: 'string' },
      statusCode: { type: 'number' },
    },
  })
  error?: {
    cause: unknown;
    name: string;
    path: string;
    statusCode: number;
  };
}

export class SuccessResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Success status',
    enum: [ResponseStatus.SUCCESS],
    example: ResponseStatus.SUCCESS,
  })
  status: ResponseStatus.SUCCESS;
}

export class ErrorResponseDto extends BaseResponseDto {
  @ApiProperty({
    description: 'Error status',
    enum: [ResponseStatus.ERROR],
    example: ResponseStatus.ERROR,
  })
  status: ResponseStatus.ERROR;

  @ApiProperty({
    description: 'Error details',
    type: 'object',
    properties: {
      cause: { type: 'string' },
      name: { type: 'string' },
      path: { type: 'string' },
      statusCode: { type: 'number' },
    },
  })
  error: {
    cause: unknown;
    name: string;
    path: string;
    statusCode: number;
  };
}

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 10,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

export class PaginatedResponseDto<T> extends SuccessResponseDto {
  @ApiProperty({
    description: 'Paginated data',
    type: 'object',
    properties: {
      items: {
        type: 'array',
        description: 'Array of items',
      },
      meta: {
        type: 'object',
        description: 'Pagination metadata',
        properties: {
          page: { type: 'number', description: 'Current page number' },
          limit: { type: 'number', description: 'Number of items per page' },
          total: { type: 'number', description: 'Total number of items' },
          totalPages: { type: 'number', description: 'Total number of pages' },
          hasNext: {
            type: 'boolean',
            description: 'Whether there is a next page',
          },
          hasPrev: {
            type: 'boolean',
            description: 'Whether there is a previous page',
          },
        },
      },
    },
  })
  data: {
    items: T[];
    meta: PaginationMetaDto;
  };
}
