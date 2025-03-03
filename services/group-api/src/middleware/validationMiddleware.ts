import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';

export const validatePayload =
    // eslint-disable-next-line consistent-return
    (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        if (error) {
            console.error(error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };

export const validateParams =
    // eslint-disable-next-line consistent-return
    (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.params);
        if (error) {
            console.error(error.details[0].message);
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };

export const validateQueryParams =
    // eslint-disable-next-line consistent-return
    (schema: Schema) => (req: Request, res: Response, next: NextFunction) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const { error, value } = schema.validate(req.query);
        if (error) {
            console.error(error.details);
            return res.status(400).json({ error: error.details });
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        req.query = value;
        next();
    };
