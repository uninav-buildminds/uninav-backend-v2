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
import { VisibilityEnum } from '@app/common/types/db.types';

@Injectable()
export class FolderService {
  constructor(
    private readonly folderRepository: FolderRepository,
    private readonly userService: UserService,
  ) {}

  // Create a new folder, ensuring visibility defaults to public
  async create(createFolderDto: CreateFolderDto) {
    // Ensure visibility is set to public if not provided
    if (!createFolderDto.visibility) {
      createFolderDto.visibility = VisibilityEnum.PUBLIC;
    }
    return this.folderRepository.create(createFolderDto);
  }

  async findAll(userId: string) {
    return this.folderRepository.findAll(userId);
  }

  /** Material IDs in any folder owned by the user (for list UIs) */
  async getMaterialIdsInUserFolders(userId: string): Promise<string[]> {
    return this.folderRepository.getMaterialIdsInUserFolders(userId);
  }

  // Fetch folders with pagination for library UIs
  async findAllPaginated(userId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const results = await this.folderRepository.findAllPaginated(
      userId,
      limit + 1,
      offset,
    );

    const hasMore = results.length > limit;
    const items = hasMore ? results.slice(0, limit) : results;
    const total = hasMore ? offset + results.length : offset + items.length;

    return {
      items,
      pagination: {
        total,
        page,
        pageSize: limit,
        totalPages: hasMore ? page + 1 : page, // Approximate total pages
        hasMore,
        hasPrev: page > 1,
      },
    };
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

  async findBySlug(slug: string, userId?: string) {
    const folder = await this.folderRepository.findBySlug(slug);
    if (!folder) {
      throw new NotFoundException(`Folder with slug ${slug} not found`);
    }

    // Track folder view in non-blocking fashion (for authenticated users)
    if (userId) {
      this.folderRepository.trackFolderView(folder.id).catch((error) => {
        console.error('Failed to track folder view:', error);
        // Silently fail - don't block the request
      });
    }

    return folder;
  }

  async getFolder(idOrSlug: string, userId?: string) {
    // Check if input is a UUID
    const isUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        idOrSlug,
      );

    let folder;
    if (isUuid) {
      folder = await this.findOne(idOrSlug, userId);
    } else {
      folder = await this.findBySlug(idOrSlug, userId);
    }

    return folder;
  }

  async findByCreator(creatorId: string) {
    return this.folderRepository.findByCreator(creatorId);
  }

  async searchFolders(query: string, limit: number = 10, offset: number = 0) {
    return this.folderRepository.searchFolders(query, limit, offset);
  }

  async getFoldersByMaterial(materialId: string) {
    return this.folderRepository.findFoldersByMaterial(materialId);
  }

  async getFolderStats(folderId: string) {
    return this.folderRepository.getFolderStats(folderId);
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

    // Check permissions: allow if user is creator OR folder is public
    if (folder.creatorId !== userId && folder.visibility !== 'public') {
      throw new ForbiddenException(
        'You can only add materials to your own folders or public folders',
      );
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
