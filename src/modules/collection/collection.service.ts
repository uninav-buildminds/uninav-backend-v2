import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCollectionDto } from './dto/create-collection.dto';
import { UpdateCollectionDto } from './dto/update-collection.dto';
import { CollectionRepository } from './collection.repository';
import { AddMaterialToCollectionDto } from './dto/add-material.dto';

@Injectable()
export class CollectionService {
  constructor(private readonly collectionRepository: CollectionRepository) {}

  async create(createCollectionDto: CreateCollectionDto) {
    return this.collectionRepository.create(createCollectionDto);
  }

  async findAll() {
    return this.collectionRepository.findAll();
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

  async update(id: string, updateCollectionDto: UpdateCollectionDto) {
    await this.findOne(id); // Verify collection exists
    return this.collectionRepository.update(id, updateCollectionDto);
  }

  async remove(id: string) {
    await this.findOne(id); // Verify collection exists
    return this.collectionRepository.remove(id);
  }

  async addMaterialToCollection(
    collectionId: string,
    addMaterialDto: AddMaterialToCollectionDto,
  ) {
    await this.findOne(collectionId); // Verify collection exists
    return this.collectionRepository.addMaterial(collectionId, addMaterialDto);
  }

  async removeMaterialFromCollection(collectionId: string, materialId: string) {
    await this.findOne(collectionId); // Verify collection exists
    return this.collectionRepository.removeMaterial(collectionId, materialId);
  }
}
