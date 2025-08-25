import { PartialType } from '@nestjs/swagger';
import { CreateMaterialDto, ResourceDto } from './create-material.dto';

export class UpdateResourceDto extends PartialType(ResourceDto) {}

export class UpdateMaterialDto extends PartialType(CreateMaterialDto) {}
