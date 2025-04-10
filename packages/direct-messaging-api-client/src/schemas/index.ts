import Joi from 'joi';

export const createConversationPayloadSchema = Joi.object({
    type: Joi.string().valid('direct', 'group', 'moderator').required(),
    participantsUserIds: Joi.array()
        .items(Joi.string().guid({ version: ['uuidv4'] }))
        .min(1)
        .required(),
    requestedByUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    channelId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .optional(),
});

export const sendMessagePayloadSchema = Joi.object({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    content: Joi.string().required().allow(''),
    senderUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const updateMessagePayloadSchema = sendMessagePayloadSchema;

export const getConversationsParamsSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const getConversationMessagesParamsSchema = Joi.object({
    conversationId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const sendMessageParamsSchema = Joi.object({
    conversationId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const updateMessageParamsSchema = Joi.object({
    conversationId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const deleteMessageParamsSchema = Joi.object({
    messageId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const closeConversationParamsSchema = Joi.object({
    conversationId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const closeConversationPayloadSchema = Joi.object({
    closedByUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});
