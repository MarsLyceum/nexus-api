import { Request } from 'express';
import { ObjectSchema } from 'joi';

export type ParamsDictionary = {
    [key: string]: string;
};

// Type guard for validating req.body
export function isValidBody<T>(
    req: Request,
    schema: ObjectSchema
): req is Request<ParamsDictionary, unknown, T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { error, value } = schema.validate(req.body);
    if (error) {
        throw new Error(
            error.details.map((detail) => detail.message).join(', ')
        );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req.body = value;
    return true;
}

// Type guard for validating req.params
export function isValidParams<T extends ParamsDictionary>(
    req: Request,
    schema: ObjectSchema
): req is Request<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { error, value } = schema.validate(req.params);
    if (error) {
        throw new Error(
            error.details.map((detail) => detail.message).join(', ')
        );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req.params = value;
    return true;
}
