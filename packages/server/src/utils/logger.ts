import fs from 'fs';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

const env = process.env.NODE_ENV || 'development';
const logDir = 'log';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new transports.DailyRotateFile({
  level: 'error',
  filename: `${logDir}/%DATE%-error.log`,
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
});

const logger = createLogger({
  level: env === 'development' ? 'debug' : 'info',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    // format.json(),
    format.printf((info) => {
      const { timestamp, level, message, ...rest } = info;
      const meta = Object.keys(rest).length ? ` ${JSON.stringify(rest)}` : '';
      return `${timestamp} [${level}]: ${message}${meta}`;
    }),
  ),
  transports: [
    new transports.Console({
      level: 'info',
      format: format.combine(
        format.colorize(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
    }),
    dailyRotateFileTransport,
  ],
});

export default logger;
