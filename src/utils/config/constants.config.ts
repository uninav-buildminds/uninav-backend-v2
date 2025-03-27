export const DRIZZLE_SYMBOL = Symbol('Drizzle');
export enum ResponseStatus {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}
export enum LoggerPaths {
  UTIL = 'logs/util.log',
  APP = 'logs/app.log',
  DATABASE = 'logs/database.log',
  CLIENT = 'logs/client.log',
}
