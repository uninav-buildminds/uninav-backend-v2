import { EmailType } from '../constants/email.enum';

// Map all EmailPaths to their corresponding EJS template filenames
export const EmailTemplates: Record<EmailType, string> = {
  [EmailType.MATERIAL_REJECTION]: 'material-rejection.ejs',
  [EmailType.BLOG_REJECTION]: 'blog-rejection.ejs',
  [EmailType.COURSE_REJECTION]: 'course-rejection.ejs',
  [EmailType.DLC_REJECTION]: 'dlc-rejection.ejs',
  [EmailType.WELCOME]: 'welcome-student.ejs', // Default, should be dynamic based on role
  [EmailType.PASSWORD_RESET]: 'password-reset.ejs',
  [EmailType.EMAIL_VERIFICATION]: 'verify-email.ejs',
  [EmailType.EMAIL_VERIFICATION_SUCCESS]: 'user-verification-success.ejs',
  [EmailType.CONTACT_US]: 'contact-us.ejs',
  [EmailType.MODERATOR_REJECTION]: 'moderator-rejection.ejs',
} as const;
