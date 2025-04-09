import { mergeResolvers } from '@graphql-tools/merge';
import { PubSub } from 'graphql-subscriptions';
import { IResolvers } from '@graphql-tools/utils';
import { userResolvers } from './userResolvers';
import { loadGroupResolvers } from './groupResolvers';
import { friendsResolvers } from './friendsResolvers';
import { directMessagingResolvers } from './directMessagingResolvers';

export const loadResolvers: () => Promise<
    IResolvers<unknown, { pubsub: PubSub }>
> = async () =>
    mergeResolvers([
        userResolvers,
        await loadGroupResolvers(),
        friendsResolvers,
        directMessagingResolvers,
    ]) as IResolvers<unknown, { pubsub: PubSub }>;
