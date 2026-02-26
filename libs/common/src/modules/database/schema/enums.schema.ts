import { pgEnum } from 'drizzle-orm/pg-core';

// Define all enum types
export const userRoleEnum = pgEnum('user_role', [
  'student',
  'moderator',
  'admin',
]);
export const materialTypeEnum = pgEnum('material_type', [
  'docs',
  'pdf',
  'ppt',
  'excel',
  'youtube',
  'gdrive',
  'image',
  'video',
  'article',
  'guide',
  'other',
]);
export const resourceTypeEnum = pgEnum('resource_type', ['url', 'upload']);
export const visibilityEnum = pgEnum('visibility_enum', ['public', 'private']);
export const restrictionEnum = pgEnum('restriction_enum', [
  'readonly',
  'downloadable',
]);
export const advertTypeEnum = pgEnum('advert_type', [
  'free',
  'pro',
  'boost',
  'targeted',
]);

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);

export const blogTypeEnum = pgEnum('blog_type', [
  'article',
  'guideline',
  'scheme_of_work',
  'tutorial',
]);
export const userIdTypeEnum = pgEnum('user_id_type', [
  'id_card',
  'admission_letter',
]);

export const clubStatusEnum = pgEnum('club_status', [
  'live',
  'flagged',
  'hidden',
]);

export const clubTargetingEnum = pgEnum('club_targeting', [
  'public',
  'specific',
  'exclude',
]);

export const clubFlagStatusEnum = pgEnum('club_flag_status', [
  'pending',
  'reviewed',
  'dismissed',
]);

export const clubRequestStatusEnum = pgEnum('club_request_status', [
  'pending',
  'fulfilled',
  'dismissed',
]);
