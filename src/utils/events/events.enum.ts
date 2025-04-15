export enum EVENTS {
  // Auth & User Events
  USER_REGISTERED = 'user.registered',
  EMAIL_VERIFICATION_REQUESTED = 'email.verification.requested',
  EMAIL_VERIFICATION_SUCCESS = 'email.verification.success',
  EMAIL_VERIFICATION_RESEND = 'email.verification.resend',
  PASSWORD_RESET_REQUESTED = 'password.reset.requested',

  // Review Events - Approvals
  COURSE_APPROVED = 'review.course.approved',
  DLC_APPROVED = 'review.dlc.approved',
  MATERIAL_APPROVED = 'review.material.approved',
  BLOG_APPROVED = 'review.blog.approved',
  MODERATOR_REQUEST_APPROVED = 'moderator.request.approved',
  ADVERT_APPROVED = 'advert.approved',

  // Review Events - Rejections
  COURSE_REJECTED = 'review.course.rejected',
  DLC_REJECTED = 'review.dlc.rejected',
  MATERIAL_REJECTED = 'review.material.rejected',
  BLOG_REJECTED = 'review.blog.rejected',
  MODERATOR_REQUEST_REJECTED = 'moderator.request.rejected',
  ADVERT_REJECTED = 'advert.rejected',

  // Deletion Events
  COURSE_DELETED = 'content.course.deleted',
  DLC_DELETED = 'content.dlc.deleted',
  MATERIAL_DELETED = 'content.material.deleted',
  BLOG_DELETED = 'content.blog.deleted',

  // Report Events
  CONTENT_REPORTED = 'content.reported',
  REPORT_REVIEWED = 'content.report.reviewed',
}
