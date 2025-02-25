import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export const validatePayload =
    (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        if (error) {
            console.error(error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };

export const validateParams =
    (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.params);
        if (error) {
            console.error(error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };

export const validateQueryParams =
    (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.query);
        if (error) {
            console.error(error.details);
            return res.status(400).json({ error: error.details });
        }
        req.query = value;
        next();
    };
