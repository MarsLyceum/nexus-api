// src/loggerMiddleware.ts
import { v4 as uuidv4 } from 'uuid';
import { createLogger, format, transports, Logger } from 'winston';
import { Request, Response, NextFunction } from 'express';

import { getCorrelationId } from './requestContext';

// Augment Express Request to include custom properties
declare global {
    namespace Express {
        interface Request {
            correlationId?: string;
            startTime?: number;
        }
    }
}
// Ensure this file is treated as a module
export {};

const logger: Logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp(), // This automatically adds a timestamp field
        format.json()
    ),
    transports: [new transports.Console()],
});

export const requestLogger = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Use the provided correlation id header if available; otherwise generate one.
    req.correlationId = getCorrelationId();
    req.startTime = Date.now();

    // Log the incoming request.
    logger.info({
        message: 'Request received',
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
    });

    // Log the outgoing response when finished.
    res.on('finish', () => {
        const duration = Date.now() - (req.startTime ?? Date.now());
        logger.info({
            message: 'Response sent',
            correlationId: req.correlationId,
            statusCode: res.statusCode,
            duration,
        });
    });

    next();
};
