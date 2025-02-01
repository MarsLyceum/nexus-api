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
 * Note: We reference users by their email addresses.
 */
export const groupMemberSchema = Joi.object({
    userEmail: Joi.string().email().required(),
    role: Joi.string()
        .valid('owner', 'admin', 'moderator', 'member')
        .required(),
    joinedAt: Joi.date().iso().required(),
});

/**
 * Schema for a group channel.
 */
export const groupChannelSchema = Joi.object({
    id: Joi.string()
        .guid({ version: ['uuidv4'] })
        .required(),
    name: Joi.string().max(100).required(),
    type: Joi.string().valid('text', 'voice').required(),
    createdAt: Joi.date().iso().required(),
});

/**
 * Schema for the payload to create a new group.
 * Expects:
 * - a group name,
 * - the creator's email,
 * - and optional description, members, and channels.
 */
export const createGroupPayloadSchema = Joi.object({
    name: Joi.string().max(100).required(),
    createdByUserEmail: Joi.string().email().required(),
    description: Joi.string().optional(),
    members: Joi.array().items(groupMemberSchema).optional(),
    channels: Joi.array().items(groupChannelSchema).optional(),
});

/**
 * Schema for the payload to update an existing group.
 * Only the group name and description are allowed to be updated.
 */
export const updateGroupPayloadSchema = Joi.object({
    name: Joi.string().max(100).optional(),
    description: Joi.string().optional(),
});

/**
 * Schemas for route parameters that identify a group.
 * These are reused for GET, DELETE, and UPDATE operations.
 */
export const getGroupParamsSchema = groupIdentifierSchema;
export const deleteGroupParamsSchema = groupIdentifierSchema;
export const updateGroupParamsSchema = groupIdentifierSchema;
