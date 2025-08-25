import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiResponse,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';
import {
  BaseResponseDto,
  PaginatedResponseDto,
  ErrorResponseDto,
} from './response.dto';

export const ApiStandardResponses = () => {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request - Invalid input data',
      type: ErrorResponseDto,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Authentication required',
      type: ErrorResponseDto,
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponseDto,
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      type: ErrorResponseDto,
    }),
  );
};

export const ApiSuccessResponse = <TModel extends Type<any>>(
  model?: TModel,
  description: string = 'Operation successful',
) => {
  if (model) {
    return applyDecorators(
      ApiExtraModels(BaseResponseDto, model),
      ApiOkResponse({
        description,
        schema: {
          allOf: [
            { $ref: getSchemaPath(BaseResponseDto) },
            {
              properties: {
                data: { $ref: getSchemaPath(model) },
              },
            },
          ],
        },
      }),
    );
  }

  return ApiOkResponse({
    description,
    type: BaseResponseDto,
  });
};

export const ApiCreatedSuccessResponse = <TModel extends Type<any>>(
  model?: TModel,
  description: string = 'Resource created successfully',
) => {
  if (model) {
    return applyDecorators(
      ApiExtraModels(BaseResponseDto, model),
      ApiCreatedResponse({
        description,
        schema: {
          allOf: [
            { $ref: getSchemaPath(BaseResponseDto) },
            {
              properties: {
                data: { $ref: getSchemaPath(model) },
              },
            },
          ],
        },
      }),
    );
  }

  return ApiCreatedResponse({
    description,
    type: BaseResponseDto,
  });
};

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
  description: string = 'Paginated results retrieved successfully',
) => {
  return applyDecorators(
    ApiExtraModels(PaginatedResponseDto, model),
    ApiOkResponse({
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedResponseDto) },
          {
            properties: {
              data: {
                type: 'object',
                properties: {
                  items: {
                    type: 'array',
                    items: { $ref: getSchemaPath(model) },
                  },
                  meta: {
                    type: 'object',
                    properties: {
                      page: { type: 'number' },
                      limit: { type: 'number' },
                      total: { type: 'number' },
                      totalPages: { type: 'number' },
                      hasNext: { type: 'boolean' },
                      hasPrev: { type: 'boolean' },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    }),
  );
};

export const ApiNotFoundResponseDecorator = (resource: string = 'Resource') => {
  return ApiNotFoundResponse({
    description: `${resource} not found`,
    type: ErrorResponseDto,
  });
};
