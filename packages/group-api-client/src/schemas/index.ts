import Joi from 'joi';

/**
 * Schema for identifying a group by its UUID.
 */
export const groupIdentifierSchema = Joi.object({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

/**
 * Schema for a group member.
 * Note: We reference users by their UUIDs.
 */
export const groupMemberSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    role: Joi.string()
        .valid('owner', 'admin', 'moderator', 'member')
        .required(),
    joinedAt: Joi.date().iso().required(),
});

/**
 * Schema for a group channel message.
 * This uses an alternatives schema to support both regular messages
 * (messageType: 'message') and post messages (messageType: 'post').
 */
export const groupChannelMessageSchema = Joi.alternatives().try(
    // Regular message
    Joi.object({
        id: Joi.string()
            .guid({ version: ['uuidv4'] })
            .required(),
        content: Joi.string().required(),
        postedAt: Joi.date().iso().required(),
        edited: Joi.boolean().required(),
        channelId: Joi.string()
            .guid({ version: ['uuidv4'] })
            .required(),
        messageType: Joi.string().valid('message').required(),
    }),
    // Post message
    Joi.object({
        id: Joi.string()
            .guid({ version: ['uuidv4'] })
            .required(),
        content: Joi.string().required(),
        postedAt: Joi.date().iso().required(),
        edited: Joi.boolean().required(),
        channelId: Joi.string()
            .guid({ version: ['uuidv4'] })
            .required(),
        messageType: Joi.string().valid('post').required(),
        title: Joi.string().max(200).required(),
        flair: Joi.string().max(50).optional(),
        domain: Joi.string().optional(),
        thumbnail: Joi.string().optional(),
        upvotes: Joi.number().default(0),
        commentsCount: Joi.number().default(0),
        shareCount: Joi.number().default(0),
    })
);

/**
 * Schema for a group channel.
 */
export const groupChannelSchema = Joi.object({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    name: Joi.string().max(100).required(),
    type: Joi.string().valid('text', 'voice', 'feed').required(),
    createdAt: Joi.date().iso().required(),
});

/**
 * Schema for the payload to create a new group.
 * Expects:
 * - a group name,
 * - the creator's UUID,
 * - and optional description, members, and channels.
 */
export const createGroupPayloadSchema = Joi.object({
    name: Joi.string().max(100).required(),
    createdByUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    publicGroup: Joi.boolean(),
});

export const createGroupChannelPayloadSchema = Joi.object({
    name: Joi.string().max(100).required(),
    type: Joi.string().valid('text', 'voice', 'feed').required(),
    groupId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const createTextChannelMessagePayloadSchema = Joi.object({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .optional(),
    channelId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    postedByUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    content: Joi.string().required().allow(''),
    attachments: Joi.array().items(Joi.object().unknown(true)).default([]),
});

export const createFeedChannelPostPayloadSchema = Joi.object({
    channelId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    postedByUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    content: Joi.string().required().allow(''),
    title: Joi.string().max(200).required(),
    flair: Joi.string().max(50).optional(),
    domain: Joi.string().optional(),
    thumbnail: Joi.string().optional(),
    attachments: Joi.array().items(Joi.object().unknown(true)).default([]),
});

/**
 * Schema for the payload to update an existing group.
 * Only the group name and description are allowed to be updated.
 */
export const updateGroupPayloadSchema = Joi.object({
    name: Joi.string().max(100).optional(),
    description: Joi.string().optional(),
});

export const updateTextChannelMessagePayloadSchema = Joi.object({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    content: Joi.string().required().allow(''),
    postedByUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

/**
 * Schemas for route parameters that identify a group.
 * These are reused for GET, DELETE, and UPDATE operations.
 */
export const getGroupParamsSchema = groupIdentifierSchema;
export const getPostParamsSchema = groupIdentifierSchema;
export const deleteGroupParamsSchema = groupIdentifierSchema;
export const updateGroupParamsSchema = groupIdentifierSchema;

export const deleteTextChannelMessageParamsSchema = Joi.object({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const getUserGroupsParamsSchema = Joi.object({
    userId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const getTextChannelMessagesParamsSchema = Joi.object({
    channelId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const getFeedChannelPostsParamsSchema = Joi.object({
    channelId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const getPostCommentsParamsSchema = Joi.object({
    postId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
});

export const getTextChannelMessagesQueryParamsSchema = Joi.object({
    offset: Joi.number(),
    limit: Joi.number().optional(),
});

export const getFeedChannelPostsQueryParamsSchema = Joi.object({
    offset: Joi.number(),
    limit: Joi.number().optional(),
});

export const getPostCommentsQueryParamsSchema = Joi.object({
    offset: Joi.number(),
    limit: Joi.number(),
    parentCommentId: Joi.string()
        .empty('')
        .default(null)
        .guid({ version: ['uuidv4'] })
        .allow(null)
        .optional(), // Can be null if it's a top-level comment
});

export const createFeedChannelPostCommentPayloadSchema = Joi.object({
    content: Joi.string().required().allow(''), // Comment content is required
    postedByUserId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(), // Must be a valid UUID
    postId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(), // Must be a valid UUID referencing the post
    parentCommentId: Joi.string()
        .guid({ version: ['uuidv4'] })
        .allow(null)
        .optional(), // Can be null if it's a top-level comment
    upvotes: Joi.number().integer().min(0).default(0), // Must be a positive integer, defaults to 0
    attachments: Joi.array().items(Joi.object().unknown(true)).default([]),
    hasChildren: Joi.boolean(),
    children: Joi.array()
        .items(Joi.link('#createFeedChannelPostCommentPayloadSchema'))
        .optional(), // Recursively validates nested replies
}).id('createFeedChannelPostCommentPayloadSchema'); // Adds an ID for self-referencing
