import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ClubsRepository } from './clubs.repository';
import { StorageService } from 'src/utils/storage/storage.service';
import { CreateClubDto, UpdateClubDto } from './dto/create-club.dto';
import { GetClubsQueryDto } from './dto/get-clubs-query.dto';
import { FlagClubDto } from './dto/flag-club.dto';
import { FlagAction, ResolveFlagDto } from './dto/resolve-flag.dto';
import { CreateClubRequestDto } from './dto/create-club-request.dto';
import {
  ClubRequestAction,
  UpdateClubRequestDto,
} from './dto/update-club-request.dto';
import { UpdateClubStatusDto } from './dto/update-club-status.dto';
import { MulterFile } from '@app/common/types';
import {
  ClubEntity,
  ClubFlagStatusEnum,
  ClubRequestStatusEnum,
  ClubStatusEnum,
  ClubTargetingEnum,
  UserEntity,
  UserRoleEnum,
} from '@app/common/types/db.types';
import {
  CLUB_IMAGE_URL_EXPIRY_DAYS,
  STORAGE_FOLDERS,
} from 'src/utils/config/constants.config';
import * as moment from 'moment-timezone';

@Injectable()
export class ClubsService {
  private readonly logger = new Logger(ClubsService.name);

  constructor(
    private readonly clubsRepository: ClubsRepository,
    private readonly storageService: StorageService
  ) {}

  async create(
    createClubDto: CreateClubDto,
    image?: MulterFile,
  ): Promise<ClubEntity> {
    try {
      let imageUrl: string | undefined;
      let imageKey: string | undefined;

      if (image) {
        const uploadResult = await this.storageService.uploadFile(image, {
          bucketType: 'private',
          folder: STORAGE_FOLDERS.CLUBS,
        });
        imageKey = uploadResult.fileKey;

        imageUrl = await this.storageService.getSignedUrl(
          imageKey,
          3600 * 24 * CLUB_IMAGE_URL_EXPIRY_DAYS,
          'private',
        );
      }

      const { targetDepartmentIds, ...clubData } = createClubDto;

      const club = await this.clubsRepository.create({
        ...clubData,
        imageUrl,
        imageKey,
      });

      // Set target departments if targeting is not public
      if (
        createClubDto.targeting &&
        createClubDto.targeting !== ClubTargetingEnum.PUBLIC &&
        targetDepartmentIds?.length
      ) {
        await this.clubsRepository.setTargetDepartments(
          club.id,
          targetDepartmentIds,
        );
      }

      return this.clubsRepository.findOne(club.id);
    } catch (error) {
      this.logger.error(`Failed to create club: ${error.message}`);
      throw new InternalServerErrorException('Failed to create club');
    }
  }

  async findAll(query: GetClubsQueryDto) {
    try {
      const result = await this.clubsRepository.findAllPaginated({
        search: query.search,
        interest: query.interest,
        departmentId: query.departmentId,
        status: query.status,
        organizerId: query.organizerId,
        page: query.page,
        limit: query.limit,
      });

      // Refresh expired signed image URLs — same logic as findOne
      const refreshPromises = result.data.map(async (club) => {
        if (!club.imageKey) return club;

        const isExpired = moment(club.updatedAt).isBefore(
          moment().subtract(CLUB_IMAGE_URL_EXPIRY_DAYS, 'days'),
        );

        if (!isExpired) return club;

        const newImageUrl = await this.storageService.getSignedUrl(
          club.imageKey,
          3600 * 24 * CLUB_IMAGE_URL_EXPIRY_DAYS,
          'private',
        );

        await this.clubsRepository.update(club.id, { imageUrl: newImageUrl });
        club.imageUrl = newImageUrl;
        return club;
      });

      result.data = await Promise.all(refreshPromises);
      return result;
    } catch (error) {
      this.logger.error(`Failed to fetch clubs: ${error.message}`);
      throw new InternalServerErrorException('Failed to fetch clubs');
    }
  }

  async findOne(id: string, viewerId?: string | null): Promise<ClubEntity> {
    const club = await this.clubsRepository.findOne(id);
    if (!club) {
      throw new NotFoundException(`Club with ID ${id} not found`);
    }

    // Refresh image URL if expired
    if (club.imageKey) {
      const isExpired = moment(club.updatedAt).isBefore(
        moment().subtract(CLUB_IMAGE_URL_EXPIRY_DAYS, 'days'),
      );

      if (isExpired) {
        const newImageUrl = await this.storageService.getSignedUrl(
          club.imageKey,
          3600 * 24 * CLUB_IMAGE_URL_EXPIRY_DAYS,
          'private',
        );

        await this.clubsRepository.update(id, { imageUrl: newImageUrl });
        club.imageUrl = newImageUrl;
      }
    }

    return club;
  }

  async update(
    id: string,
    updateClubDto: UpdateClubDto,
    userId: string,
    userRole: UserRoleEnum,
    image?: MulterFile,
  ): Promise<ClubEntity> {
    try {
      const club = await this.findOne(id);

      // Only organizer or admin/moderator can update
      if (
        club.organizerId !== userId &&
        userRole !== UserRoleEnum.ADMIN &&
        userRole !== UserRoleEnum.MODERATOR
      ) {
        throw new ForbiddenException(
          'You do not have permission to update this club',
        );
      }

      const { targetDepartmentIds, ...updateData } = updateClubDto;
      const data: any = { ...updateData };

      if (image) {
        const uploadResult = await this.storageService.uploadFile(image, {
          bucketType: 'private',
          folder: STORAGE_FOLDERS.CLUBS,
        });
        const { fileKey } = uploadResult;

        const imageUrl = await this.storageService.getSignedUrl(
          fileKey,
          3600 * 24 * CLUB_IMAGE_URL_EXPIRY_DAYS,
          'private',
        );

        // Delete old image if exists
        if (club.imageKey) {
          try {
            await this.storageService.deleteFile(club.imageKey, 'private');
          } catch (error) {
            this.logger.error(`Failed to delete old club image: ${error.message}`);
          }
        }

        data.imageUrl = imageUrl;
        data.imageKey = fileKey;
      }

      await this.clubsRepository.update(id, data);

      // Update target departments if provided
      if (targetDepartmentIds !== undefined) {
        const targeting = updateClubDto.targeting || club.targeting;
        if (targeting === ClubTargetingEnum.PUBLIC) {
          // If switching to public, clear all target departments
          await this.clubsRepository.setTargetDepartments(id, []);
        } else {
          await this.clubsRepository.setTargetDepartments(
            id,
            targetDepartmentIds,
          );
        }
      }

      return this.findOne(id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update club: ${error.message}`);
      throw new InternalServerErrorException('Failed to update club');
    }
  }

  async remove(
    id: string,
    userId: string,
    userRole: UserRoleEnum,
  ): Promise<ClubEntity> {
    try {
      const club = await this.findOne(id);

      // Only organizer or admin can delete
      if (
        club.organizerId !== userId &&
        userRole !== UserRoleEnum.ADMIN
      ) {
        throw new ForbiddenException(
          'You do not have permission to delete this club',
        );
      }

      // Delete image from storage if exists
      if (club.imageKey) {
        try {
          await this.storageService.deleteFile(club.imageKey, 'public');
        } catch (error) {
          this.logger.error(`Failed to delete club image: ${error.message}`);
        }
      }

      return this.clubsRepository.remove(id);
    } catch (error) {
      if (error instanceof ForbiddenException) {
        throw error;
      }
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete club: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete club');
    }
  }

  async findBySlug(slug: string, viewerId?: string | null): Promise<ClubEntity> {
    const club = await this.clubsRepository.findBySlug(slug);
    if (!club) {
      throw new NotFoundException(`Club with slug "${slug}" not found`);
    }
    // Delegate to findOne for URL refresh + view tracking
    return this.findOne(club.id, viewerId);
  }

  async getAnalytics(clubId: string, requesterId: string, requesterRole: UserRoleEnum) {
    const club = await this.findOne(clubId);
    if (
      club.organizerId !== requesterId &&
      requesterRole !== UserRoleEnum.ADMIN &&
      requesterRole !== UserRoleEnum.MODERATOR
    ) {
      throw new ForbiddenException('You do not have permission to view analytics for this club');
    }
    return this.clubsRepository.getAnalytics(clubId);
  }

  // Track a detail-page click — anonymous-safe, skips if viewer is the organizer
  async trackClick(
    clubId: string,
    viewerId?: string | null,
  ): Promise<{ clickCount: number }> {
    const club = await this.clubsRepository.findOne(clubId);
    if (!club) throw new Error(`Club ${clubId} not found`);

    // Soft guard: don't count organizer's own views
    if (viewerId && viewerId === club.organizerId) {
      return { clickCount: club.clickCount };
    }

    const clickCount = await this.clubsRepository.incrementClickCount(clubId);
    return { clickCount };
  }

  // Track a join — authenticated users only, idempotent
  async trackJoin(
    clubId: string,
    user: UserEntity,
  ): Promise<{ externalLink: string }> {
    const club = await this.findOne(clubId);

    // Non-blocking: insert join record + increment joinCount
    this.clubsRepository.createJoin(clubId, user.id).catch((err) => {
      this.logger.warn(`Failed to record join for club ${clubId}: ${err.message}`);
    });

    return { externalLink: club.externalLink };
  }

  async updateStatus(
    id: string,
    updateStatusDto: UpdateClubStatusDto,
  ): Promise<ClubEntity> {
    const club = await this.findOne(id);
    return this.clubsRepository.update(club.id, {
      status: updateStatusDto.status as ClubStatusEnum,
    });
  }

  async flagClub(flagDto: FlagClubDto) {
    // Verify club exists
    await this.findOne(flagDto.clubId);

    return this.clubsRepository.createFlag({
      clubId: flagDto.clubId,
      reporterId: flagDto.reporterId,
      reason: flagDto.reason,
    });
  }

  async getFlags(options: {
    status?: ClubFlagStatusEnum;
    page?: number;
    limit?: number;
  }) {
    return this.clubsRepository.findFlagsPaginated(options);
  }

  async resolveFlag(flagId: string, resolveFlagDto: ResolveFlagDto) {
    const { action } = resolveFlagDto;

    let flagStatus: ClubFlagStatusEnum;

    switch (action) {
      case FlagAction.APPROVE:
        // Flag was valid — mark reviewed, but club stays live
        flagStatus = ClubFlagStatusEnum.REVIEWED;
        break;
      case FlagAction.HIDE:
        // Flag was valid — hide the club
        flagStatus = ClubFlagStatusEnum.REVIEWED;
        break;
      case FlagAction.DISMISS:
        // Flag was invalid — dismiss
        flagStatus = ClubFlagStatusEnum.DISMISSED;
        break;
    }

    const flag = await this.clubsRepository.updateFlag(flagId, {
      status: flagStatus,
    });

    // If action is hide, also update the club status
    if (action === FlagAction.HIDE && flag.clubId) {
      await this.clubsRepository.update(flag.clubId, {
        status: ClubStatusEnum.HIDDEN,
      });
    }

    return flag;
  }

  async createRequest(requestDto: CreateClubRequestDto) {
    return this.clubsRepository.createRequest(requestDto);
  }

  async getRequests(options: {
    status?: ClubRequestStatusEnum;
    page?: number;
    limit?: number;
  }) {
    return this.clubsRepository.findRequestsPaginated(options);
  }

  async updateRequest(
    requestId: string,
    updateRequestDto: UpdateClubRequestDto,
  ) {
    const statusMap: Record<ClubRequestAction, ClubRequestStatusEnum> = {
      [ClubRequestAction.FULFILLED]: ClubRequestStatusEnum.FULFILLED,
      [ClubRequestAction.DISMISSED]: ClubRequestStatusEnum.DISMISSED,
    };

    return this.clubsRepository.updateRequest(requestId,  {
      status: statusMap[updateRequestDto.status],
    });
  }
}
