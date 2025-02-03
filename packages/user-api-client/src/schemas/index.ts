import Joi, { ObjectSchema } from 'joi';

import {
    CreateUserPayload,
    GetUserParams,
    DeleteUserParams,
    UpdateUserParams,
    UpdateUserPayload,
} from '../payloads';

const userIdentifierSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

const userProfileSchema = Joi.object({
    email: Joi.string().email().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
});

export const createUserPayloadSchema: ObjectSchema<CreateUserPayload> =
    userProfileSchema as ObjectSchema<CreateUserPayload>;

export const getUserParamsSchema: ObjectSchema<GetUserParams> =
    userIdentifierSchema as ObjectSchema<GetUserParams>;

export const getUserByEmailParamsSchema = Joi.object({
    email: Joi.string().email().required(),
});

export const deleteUserParamsSchema: ObjectSchema<DeleteUserParams> =
    userIdentifierSchema as ObjectSchema<DeleteUserParams>;

export const updateUserParamsSchema: ObjectSchema<UpdateUserParams> =
    userIdentifierSchema as ObjectSchema<UpdateUserParams>;

export const updateUserPayloadSchema: ObjectSchema<UpdateUserPayload> =
    userProfileSchema as ObjectSchema<UpdateUserPayload>;
