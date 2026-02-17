import winston from 'winston';
const { combine, timestamp, printf, colorize, errors } = winston.format;
/**
 * Custom log format for development
 */
const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    if (stack) {
        log += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
    }
    return log;
});
/**
 * Custom log format for production (JSON)
 */
const prodFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const logObject = {
        timestamp,
        level,
        message,
        ...(stack ? { stack } : {}),
        ...meta,
    };
    return JSON.stringify(logObject);
});
/**
 * Create the Winston logger instance
 */
export const logger = winston.createLogger({
    level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
    format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
    defaultMeta: { service: 'bot_man' },
    transports: [
        new winston.transports.Console({
            format: combine(process.env.NODE_ENV === 'production' ? prodFormat : combine(colorize(), devFormat)),
        }),
    ],
});
// Add file transport in production
if (process.env.NODE_ENV === 'production') {
    logger.add(new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: combine(timestamp(), prodFormat),
    }));
    logger.add(new winston.transports.File({
        filename: 'logs/combined.log',
        format: combine(timestamp(), prodFormat),
    }));
}
export default logger;
//# sourceMappingURL=logger.js.map