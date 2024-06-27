import { Request, Response, NextFunction } from 'express';
import { ObjectSchema } from 'joi';

// import { isValidBody, isValidParams } from './validationTypeGuards';

export const validatePayload =
    (schema: ObjectSchema) =>
    // eslint-disable-next-line consistent-return
    (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };

export const validateParams =
    (schema: ObjectSchema) =>
    // eslint-disable-next-line consistent-return
    (req: Request, res: Response, next: NextFunction) => {
        const { error } = schema.validate(req.params);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }
        next();
    };
