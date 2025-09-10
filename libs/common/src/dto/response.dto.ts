import { ResponseStatus } from 'src/utils/config/constants.config';

// Generic response DTO for standard and paginated API responses
export class ResponseDto<T = any> {
  constructor(
    public message: string,
    public status: ResponseStatus,
    public data?: T,
    public error?: {
      cause: unknown;
      name: string;
      path: string;
      statusCode: number;
    },
  ) {}

  // Create a standard success response
  public static createSuccessResponse<T>(
    message: string,
    data?: T,
  ): ResponseDto<T> {
    return new ResponseDto<T>(message, ResponseStatus.SUCCESS, data);
  }

  // Create a standard error response
  public static createErrorResponse<T>(
    message: string,
    error?: {
      cause: unknown;
      name: string;
      path: string;
      statusCode: number;
    },
  ): ResponseDto<T> {
    return new ResponseDto<T>(message, ResponseStatus.ERROR, undefined, error);
  }

  // Create a paginated success response with hasMore & hasPrev
  public static createPaginatedResponse<T>(
    message: string,
    items: T[],
    pagination: {
      total: number;
      page: number;
      pageSize: number;
      totalPages?: number;
    },
  ): PaginationResponseDto<T> {
    // Calculate totalPages if not provided
    const totalPages =
      pagination.totalPages ??
      Math.ceil((pagination.total || 0) / (pagination.pageSize || 1));

    // Determine if there are more pages after the current one
    const hasMore = pagination.page < totalPages;
    // Determine if there are previous pages before the current one
    const hasPrev = pagination.page > 1;

    return new ResponseDto(message, ResponseStatus.SUCCESS, {
      items,
      pagination: {
        total: pagination.total,
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalPages,
        hasMore,
        hasPrev,
      },
    });
  }
}

export type PaginationResponseDto<T> = ResponseDto<{
  items: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasMore: boolean;
    hasPrev: boolean;
  };
}>;
