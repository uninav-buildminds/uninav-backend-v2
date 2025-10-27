import pino from 'pino';

export const pinoConfig: pino.LoggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
          },
        }
      : undefined,
};
