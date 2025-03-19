import Joi, { ObjectSchema } from 'joi';

import {
    CreateUserPayload,
    GetUserParams,
    DeleteUserParams,
    UpdateUserParams,
    UpdateUserPayload,
} from '../payloads';

export const searchForUsersParamsSchema = Joi.object({
    searchQuery: Joi.string().required(),
});

const userIdentifierSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

const userProfileSchema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().required(),
    status: Joi.string()
        .valid('online', 'offline', 'idle', 'invisible', 'dnd')
        .optional(),
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
    Joi.object({
        id: Joi.string()
            .guid({ version: ['uuidv4'] })
            .optional(),
        email: Joi.string().email().optional(),
        username: Joi.string().optional(),
        firstName: Joi.string().optional(),
        lastName: Joi.string().optional(),
        phoneNumber: Joi.string().optional(),
        status: Joi.string()
            .valid('online', 'offline', 'idle', 'invisible', 'dnd')
            .optional(),
    });
