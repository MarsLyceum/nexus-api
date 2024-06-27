import { ObjectSchema } from 'joi';
import { CreateUserPayload, GetUserParams, DeleteUserParams, UpdateUserParams, UpdateUserPayload } from '../payloads';
export declare const createUserPayloadSchema: ObjectSchema<CreateUserPayload>;
export declare const getUserParamsSchema: ObjectSchema<GetUserParams>;
export declare const deleteUserParamsSchema: ObjectSchema<DeleteUserParams>;
export declare const updateUserParamsSchema: ObjectSchema<UpdateUserParams>;
export declare const updateUserPayloadSchema: ObjectSchema<UpdateUserPayload>;
