import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialDto, ResourceDto } from './create-material.dto';
import { IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateResourceDto extends PartialType(ResourceDto) {}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
