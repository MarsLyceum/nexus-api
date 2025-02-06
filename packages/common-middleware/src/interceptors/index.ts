// src/interceptors/index.ts
import axios, { InternalAxiosRequestConfig, AxiosHeaders } from 'axios';
import { getCorrelationId } from '../middleware';

axios.interceptors.request.use(
    (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
        const correlationId = getCorrelationId();
        if (correlationId) {
            // Ensure headers exist: if not, create a new AxiosHeaders instance.
            if (!config.headers) {
                config.headers = new AxiosHeaders();
            }
            // Set the correlation ID header. Using set() ensures that the header is added correctly.
            if (typeof config.headers.set === 'function') {
                config.headers.set('x-correlation-id', correlationId);
            } else {
                // Fallback (should not usually happen): directly assign if set() is not available.
                (config.headers as any)['x-correlation-id'] = correlationId;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);
