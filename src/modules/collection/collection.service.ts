import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CollectionRepository } from './collection.repository';
import { AddMaterialToCollectionDto } from './dto/add-material.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class CollectionService {
  constructor(
    private readonly collectionRepository: CollectionRepository,
    private readonly userService: UserService,
  ) {}

  async create(createCollectionDto: CreateCollectionDto) {
    return this.collectionRepository.create(createCollectionDto);
  }

  async findAll(userId: string) {
    return this.collectionRepository.findAll(userId);
  }

  async findOne(id: string) {
    const collection = await this.collectionRepository.findOne(id);
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
    return collection;
  }

  async findByCreator(creatorId: string) {
    return this.collectionRepository.findByCreator(creatorId);
  }

  async update(
    id: string,
    updateCollectionDto: UpdateCollectionDto,
    userId: string,
  ) {
    const collection = await this.findOne(id);

    // Check ownership
    if (collection.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own collections');
    }

    return this.collectionRepository.update(id, updateCollectionDto);
  }

  async remove(id: string, userId: string) {
    const collection = await this.findOne(id);

    // Check ownership
    if (collection.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own collections');
    }

    return this.collectionRepository.remove(id);
  }

  async addMaterialToCollection(
    collectionId: string,
    addMaterialDto: AddMaterialToCollectionDto,
    userId: string,
  ) {
    const collection = await this.findOne(collectionId);

    // Check ownership
    if (collection.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own collections');
    }

    // Check if material is already in collection
    const existingContent =
      await this.collectionRepository.findContentByMaterial(
        collectionId,
        addMaterialDto.materialId,
      );

    if (existingContent) {
      throw new BadRequestException('Material is already in this collection');
    }

    return this.collectionRepository.addMaterial(collectionId, addMaterialDto);
  }

  async removeMaterialFromCollection(
    collectionId: string,
    materialId: string,
    userId: string,
  ) {
    const collection = await this.findOne(collectionId);

    // Check ownership
    if (collection.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own collections');
    }

    return this.collectionRepository.removeMaterial(collectionId, materialId);
  }

  async addNestedCollection(parentId: string, childId: string, userId: string) {
    // Check parent collection exists and user owns it
    const parentCollection = await this.findOne(parentId);
    if (parentCollection.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own collections');
    }

    // Check child collection exists
    const childCollection = await this.findOne(childId);
    if (!childCollection) {
      throw new NotFoundException(
        `Collection to nest with ID ${childId} not found`,
      );
    }

    // Prevent circular nesting
    await this.validateNoCircularNesting(parentId, childId);

    return this.collectionRepository.addNestedCollection(parentId, childId);
  }

  async removeNestedCollection(
    parentId: string,
    childId: string,
    userId: string,
  ) {
    const collection = await this.findOne(parentId);

    // Check ownership
    if (collection.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own collections');
    }

    return this.collectionRepository.removeNestedCollection(parentId, childId);
  }

  private async validateNoCircularNesting(parentId: string, childId: string) {
    // Get all nested collections of the child
    const nestedCollections =
      await this.collectionRepository.getAllNestedCollections(childId);

    // Check if parent is in the nested collections
    if (nestedCollections.some((c) => c.id === parentId)) {
      throw new BadRequestException('Circular nesting is not allowed');
    }
  }
}
