import * as schema from '@app/common/modules/database/schema/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { InferSelectModel } from 'drizzle-orm';
// Tables
import { users } from '@app/common/modules/database/schema/user.schema';
import { moderator } from '@app/common/modules/database/schema/moderator.schema';
import { faculty } from '@app/common/modules/database/schema/faculty.schema';
import { department } from '@app/common/modules/database/schema/department.schema';
import { courses } from '@app/common/modules/database/schema/course.schema';
import { material } from '@app/common/modules/database/schema/material.schema';
import { collection } from '@app/common/modules/database/schema/collection.schema';
import { blogs } from '@app/common/modules/database/schema/blog.schema';
import { comments } from '@app/common/modules/database/schema/comments.schema';
import { advert } from '@app/common/modules/database/schema/advert.schema';
import { recent } from '@app/common/modules/database/schema/recent.schema';
import { auth } from '@app/common/modules/database/schema/schema';
export type DrizzleDB = NodePgDatabase<typeof schema>;

export type UserEntity = Omit<
  InferSelectModel<typeof users>,
  'password' | 'email' | 'matricNo' | 'studentIdType' | 'studentIdImage'
>;
export type ModeratorEntity = InferSelectModel<typeof moderator>;
export type FacultyEntity = InferSelectModel<typeof faculty>;
export type DepartmentEntity = InferSelectModel<typeof department>;
export type CourseEntity = InferSelectModel<typeof courses>;
export type MaterialEntity = InferSelectModel<typeof material>;
export type CollectionEntity = InferSelectModel<typeof collection>;
export type BlogEntity = InferSelectModel<typeof blogs>;
export type CommentEntity = InferSelectModel<typeof comments>;
export type AdvertEntity = InferSelectModel<typeof advert>;
export type RecentEntity = InferSelectModel<typeof recent>;

export type AuthEntity = InferSelectModel<typeof auth>;

export enum UserRoleEnum {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  STUDENT = 'student',
}

export enum ApprovalStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum VisibilityEnum {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export enum RestrictionEnum {
  READONLY = 'readonly',
  DOWNLOADABLE = 'downloadable',
}

export enum AdvertTypeEnum {
  FREE = 'free',
  PAID = 'pro',
  BOOST = 'boost',
  TARGETED = 'targeted',
}

export enum BlogTypeEnum {
  ARTICLE = 'article',
  GUIDELINE = 'guideline',
  SCHEME_OF_WORK = 'scheme_of_work',
  TUTORIAL = 'tutorial',
}

export enum MaterialTypeEnum {
  DOCS = 'docs',
  PDF = 'pdf',
  PPT = 'ppt',
  GDRIVE = 'gdrive',
  EXCEL = 'excel',
  IMAGE = 'image',
  VIDEO = 'video',
  YOUTUBE = 'youtube',
  ARTICLE = 'article',
  OTHER = 'other',
}

export enum ResourceType {
  // url doesn't need to be uploaded
  URL = 'url',

  // uploaded means the file is uploaded to the server
  UPLOAD = 'upload',
}

export enum UserIdTypeEnum {
  ID_CARD = 'id_card',
  ADMISSION_LETTER = 'admission_letter',
}
