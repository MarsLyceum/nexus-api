import { mergeResolvers } from '@graphql-tools/merge';
import { userResolvers } from './userResolvers';
import { groupResolvers } from './groupResolvers';

export const resolvers = mergeResolvers([userResolvers, groupResolvers]);
