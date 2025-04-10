export enum EmailPaths {
  WELCOME_STUDENT = 'welcome-student.ejs',
  WELCOME_MODERATOR = 'welcome-moderator.ejs',
  WELCOME_ADMIN = 'welcome-admin.ejs',
  PASSWORD_RESET = 'password-reset.ejs',
  EMAIL_VERIFICATION = 'verify-email.ejs',
  USER_REGISTRATION = 'user-registration.ejs',
  USER_VERIFICATION_SUCCESS = 'user-verification-success.ejs',
  MATERIAL_REJECTION = 'emails/material-rejection.ejs',
  BLOG_REJECTION = 'emails/blog-rejection.ejs',
  MODERATOR_REJECTION = 'emails/moderator-rejection.ejs',
  COURSE_REJECTION = 'emails/course-rejection.ejs',
  DLC_REJECTION = 'emails/dlc-rejection.ejs',
}

export enum EmailSubjects {
  WELCOME = 'Welcome to Uninav',
  PASSWORD_RESET = 'Reset Your Password',
  EMAIL_VERIFICATION = 'Verify Your Email Address',
  EMAIL_VERIFICATION_SUCCESS = 'Email Verification Successful',
  CONTACT_US = 'Contact Us',
  MATERIAL_REJECTION = 'Study Material Review Result - Rejected',
  BLOG_REJECTION = 'Blog Post Review Result - Rejected',
  MODERATOR_REJECTION = 'Moderator Request Result - Rejected',
  COURSE_REJECTION = 'Course Review Result - Rejected',
  DLC_REJECTION = 'Department Level Course Review Result - Rejected',
}
