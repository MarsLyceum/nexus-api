// src/requestContext.ts
import { AsyncLocalStorage } from 'node:async_hooks';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

interface RequestContext {
    correlationId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Middleware that initializes the request context with a correlation ID.
 */
export const requestContextMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Use the existing header or generate a new correlation ID.
    const correlationId =
        (req.headers['x-correlation-id'] as string) || uuidv4();
    // Optionally, you can attach it to req (after augmenting the Express Request type)
    req.correlationId = correlationId;

    // Run the rest of the request inside the AsyncLocalStorage context.
    asyncLocalStorage.run({ correlationId }, () => {
        next();
    });
};

/**
 * Helper to retrieve the current correlation ID.
 */
export const getCorrelationId = (): string | undefined => {
    const store = asyncLocalStorage.getStore();
    return store?.correlationId;
};
