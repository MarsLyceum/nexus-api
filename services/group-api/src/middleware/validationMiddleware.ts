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

export const validateQueryParams =
    (schema: ObjectSchema) =>
    // eslint-disable-next-line consistent-return
    (req: Request, res: Response, next: NextFunction) => {
        const { error, value } = schema.validate(req.query);
        if (error) {
            // Return a 400 error with the validation details.
            return res.status(400).json({ error: error.details });
        }
        // Optionally, update req.query with the validated value.
        req.query = value;
        next();
    };
