import { EmailType } from '../constants/email.enum';

export const EmailSubjects: Record<EmailType, string> = {
  [EmailType.MATERIAL_REJECTION]: 'Material Rejection',
  [EmailType.BLOG_REJECTION]: 'Blog Rejection',
  [EmailType.COURSE_REJECTION]: 'Course Rejection',
  [EmailType.DLC_REJECTION]: 'DLC Rejection',
  [EmailType.WELCOME]: 'Welcome to Uninav',
  [EmailType.PASSWORD_RESET]: 'Reset Your UniNav Password',
  [EmailType.EMAIL_VERIFICATION]: 'Verify Your Email Address',
  [EmailType.EMAIL_VERIFICATION_SUCCESS]: 'Email Verification Successful',
  [EmailType.CONTACT_US]: 'Contact Us',
  [EmailType.MODERATOR_REJECTION]: 'Moderator Request Result - Rejected',
} as const;
