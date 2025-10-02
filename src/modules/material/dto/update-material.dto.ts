import { PartialType } from '@nestjs/mapped-types';
import { CreateMaterialDto, ResourceDto } from './create-material.dto';
import { IsString } from 'class-validator';
import { IsOptional } from 'class-validator';

export class UpdateResourceDto extends PartialType(ResourceDto) {}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
