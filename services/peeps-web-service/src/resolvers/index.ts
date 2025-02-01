import { mergeResolvers } from '@graphql-tools/merge';
import { PubSub } from 'graphql-subscriptions';
import { IResolvers } from '@graphql-tools/utils';
import { userResolvers } from './userResolvers';
import { groupResolvers } from './groupResolvers';

export const resolvers: IResolvers<unknown, { pubsub: PubSub }> =
    mergeResolvers([userResolvers, groupResolvers]) as IResolvers<
        unknown,
        { pubsub: PubSub }
    >;
