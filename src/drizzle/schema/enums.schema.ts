import { pgEnum } from 'drizzle-orm/pg-core';

// Define all enum types
export const userRoleEnum = pgEnum('userRole', [
  'student',
  'moderator',
  'admin',
]);
export const materialStatusEnum = pgEnum('materialStatus', [
  'pending',
  'approved',
  'rejected',
]);
export const materialTypeEnum = pgEnum('resourceType', [
  'pdf',
  'video',
  'article',
  'image',
]);
export const resourceTypeEnum = pgEnum('resourceType', [
  'url',
  'GDrive',
  'uploaded',
]);
export const visibilityEnum = pgEnum('visibilityEnum', ['public', 'private']);
export const restrictionEnum = pgEnum('restrictionEnum', [
  'readonly',
  'downloadable',
]);
export const advertStatusEnum = pgEnum('advertStatus', [
  'pending',
  'approved',
  'rejected',
]);
export const advertTypeEnum = pgEnum('advertType', ['free', 'paid']);
export const blogTypeEnum = pgEnum('blogType', [
  'article',
  'guideline',
  'scheme_of_work',
  'tutorial',
]);
