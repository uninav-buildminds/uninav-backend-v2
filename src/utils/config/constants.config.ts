import { CookieOptions } from 'express';
import * as moment from 'moment-timezone';
export const DRIZZLE_SYMBOL = Symbol('Drizzle');
export const JWT_SYMBOL = Symbol('JWT');

// Response status
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}

// Logging service paths
export enum LoggerPaths {
  UTIL = 'logs/util.log',
  APP = 'logs/app.log',
  DATABASE = 'logs/database.log',
  CLIENT = 'logs/client.log',
}

// Cookie options
let cookie_duration = 7; // days
export const globalCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
  expires: moment().add(cookie_duration, 'days').toDate(),
  // maxAge: 60 * 60 * 24 * cookie_duration,
};

// Blackbase buckets
export enum B2_BUCKETS {
  media = 'uninav-media',
  docs = 'uninav-docs',
  blogs = 'uninav-blogs',
}

// Material Resource config
export const RESOURCE_ADDRESS_EXPIRY_DAYS = 7;
export const RESOURCE_DOWNLOAD_URL_EXPIRY_DAYS = 7;
export const BLOG_HEADING_IMG_URL_EXPIRY_DAYS = 7; // Heading image URLs expire after 7 days
export const ADVERT_IMAGE_URL_EXPIRY_DAYS = 7; // Advert image URLs expire after 7 days

export const EmailPaths = {
  COURSE_REJECTION: 'emails/course-rejection.ejs',
  DLC_REJECTION: 'emails/dlc-rejection.ejs',
  MATERIAL_REJECTION: 'emails/material-rejection.ejs',
  BLOG_REJECTION: 'emails/blog-rejection.ejs',
  MODERATOR_REJECTION: 'emails/moderator-rejection.ejs',
} as const;
