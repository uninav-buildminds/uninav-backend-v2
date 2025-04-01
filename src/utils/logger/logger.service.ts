import { LoggerPaths } from 'src/utils/config/constants.config';
import { Injectable } from '@nestjs/common';
import { configService } from 'src/utils/config/config.service';
import pino from 'pino';
import { ENV } from 'src/utils/config/env.enum';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class LoggerService {
  private logger: pino.Logger;

  constructor(
    private loggerPath: LoggerPaths,
    fileLogging = false,
  ) {
    const label =
      Object.keys(LoggerPaths)[Object.values(LoggerPaths).indexOf(loggerPath)];

    if (fileLogging) {
      // * create log files & folders
      const fullPath = path.join(__dirname, '..', '..', loggerPath);
      const dirExists = fs.existsSync(path.dirname(fullPath));
      if (!dirExists) {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      }
      const fileExists = fs.existsSync(fullPath);

      if (!fileExists) {
        fs.writeFileSync(fullPath, '');
      }
    }
    const transport = pino.transport({
      targets: [
        // Pretty logs for console in development
        {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss',
            ignore: 'pid,hostname',
          },
        },
        // File logging in JSON format
        fileLogging
          ? {
              target: 'pino/file',
              options: { destination: this.loggerPath },
            }
          : null,
      ].filter(Boolean) as any[], // Remove null if not in development
    });
    this.logger = pino(
      {
        // ! since label is being added manually
        // base: { label },
        timestamp: pino.stdTimeFunctions.isoTime,
        level: 'trace',
      },
      transport,
    );
  }

  /**
   * Private helper method to handle logging with consistent format
   * @param level The log level (info, debug, error, warn)
   * @param message The primary message to log
   * @param args Additional arguments to include in the log
   */
  private logAll(
    level: 'info' | 'debug' | 'error' | 'warn',
    message: string,
    ...args: any[]
  ): void {
    if (args.length > 0) {
      // ! due to nestjs logger it adds label as last argument
      let label = args.pop();
      message = `(${label}) ${message}`;
    }
    if (args.length === 0) {
      this.logger[level](message);
    } else if (args.length === 1 && typeof args[0] === 'object') {
      this.logger[level]({ msg: message, ...args[0] });
    } else {
      this.logger[level]({ msg: message, data: args });
    }
  }

  log(message: string, ...args: any[]): void {
    this.logAll('info', message, ...args);
  }
  info(message: string, ...args: any[]): void {
    this.logAll('info', message, ...args);
  }

  debug(message: string, ...args: any[]): void {
    this.logAll('debug', message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.logAll('error', message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.logAll('warn', message, ...args);
  }
}
