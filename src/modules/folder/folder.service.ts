import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { FolderRepository } from './folder.repository';
import { AddMaterialToFolderDto } from './dto/add-material.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class FolderService {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly userService: UserService,
  ) {}

  async create(createFolderDto: CreateFolderDto) {
    return this.folderRepository.create(createFolderDto);
  }

  async findAll(userId: string) {
    return this.folderRepository.findAll(userId);
  }

  async findOne(id: string, userId?: string) {
    const folder = await this.folderRepository.findOne(id);
    if (!folder) {
      throw new NotFoundException(`Folder with ID ${id} not found`);
    }

    // Track folder view in non-blocking fashion (for authenticated users)
    if (userId) {
      this.folderRepository.trackFolderView(id).catch((error) => {
        console.error('Failed to track folder view:', error);
        // Silently fail - don't block the request
      });
    }

    return folder;
  }

  async findByCreator(creatorId: string) {
    return this.folderRepository.findByCreator(creatorId);
  }

  async searchFolders(query: string, limit: number = 10) {
    return this.folderRepository.searchFolders(query, limit);
  }

  async getFoldersByMaterial(materialId: string) {
    return this.folderRepository.findFoldersByMaterial(materialId);
  }

  async update(id: string, updateFolderDto: UpdateFolderDto, userId: string) {
    const folder = await this.findOne(id);

    // Check ownership
    if (folder.creatorId !== userId) {
      throw new ForbiddenException('You can only update your own folders');
    }

    return this.folderRepository.update(id, updateFolderDto);
  }

  async remove(id: string, userId: string) {
    const folder = await this.findOne(id);

    // Check ownership
    if (folder.creatorId !== userId) {
      throw new ForbiddenException('You can only delete your own folders');
    }

    return this.folderRepository.remove(id);
  }

  async addMaterialToFolder(
    folderId: string,
    addMaterialDto: AddMaterialToFolderDto,
    userId: string,
  ) {
    const folder = await this.findOne(folderId);

    // Check ownership
    if (folder.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own folders');
    }

    // Check if material is already in folder
    const existingContent = await this.folderRepository.findContentByMaterial(
      folderId,
      addMaterialDto.materialId,
    );

    if (existingContent) {
      throw new BadRequestException('Material is already in this folder');
    }

    return this.folderRepository.addMaterial(folderId, addMaterialDto);
  }

  async removeMaterialFromFolder(
    folderId: string,
    materialId: string,
    userId: string,
  ) {
    const folder = await this.findOne(folderId);

    // Check ownership
    if (folder.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own folders');
    }

    return this.folderRepository.removeMaterial(folderId, materialId);
  }

  async addNestedFolder(parentId: string, childId: string, userId: string) {
    // Check parent folder exists and user owns it
    const parentFolder = await this.findOne(parentId);
    if (parentFolder.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own folders');
    }

    // Check child folder exists
    const childFolder = await this.findOne(childId);
    if (!childFolder) {
      throw new NotFoundException(
        `Folder to nest with ID ${childId} not found`,
      );
    }

    // Prevent circular nesting
    await this.validateNoCircularNesting(parentId, childId);

    return this.folderRepository.addNestedFolder(parentId, childId);
  }

  async removeNestedFolder(parentId: string, childId: string, userId: string) {
    const folder = await this.findOne(parentId);

    // Check ownership
    if (folder.creatorId !== userId) {
      throw new ForbiddenException('You can only modify your own folders');
    }

    return this.folderRepository.removeNestedFolder(parentId, childId);
  }

  private async validateNoCircularNesting(parentId: string, childId: string) {
    // Get all nested folders of the child
    const nestedFolders =
      await this.folderRepository.getAllNestedFolders(childId);

    // Check if parent is in the nested folders
    if (nestedFolders.some((c) => c.id === parentId)) {
      throw new BadRequestException('Circular nesting is not allowed');
    }
  }
}
