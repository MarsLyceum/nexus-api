// src/combinedMiddleware.ts
import { Application } from 'express';
import { requestContextMiddleware, requestLogger } from './middleware';

// Import the axios interceptor so it is automatically applied.
import './interceptors/index';

/**
 * Applies the common middleware for the application:
 *  - request context middleware (which sets up AsyncLocalStorage and correlation IDs),
 *  - request logger middleware,
 *  - and the Axios interceptor (imported above).
 *
 * @param app The Express application.
 */
export function applyCommonMiddleware(app: Application): void {
    app.use(requestContextMiddleware);
    app.use(requestLogger);
}
