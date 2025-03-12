import Joi from 'joi';

export const sendFriendRequestPayloadSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    friendUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const acceptFriendRequestParamsSchema = Joi.object({
    friendId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const removeFriendParamsSchema = Joi.object({
    friendId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const getFriendsParamsSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});
