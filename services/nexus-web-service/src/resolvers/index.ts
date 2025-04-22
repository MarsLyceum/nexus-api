import { mergeResolvers } from '@graphql-tools/merge';
import { IResolvers } from '@graphql-tools/utils';
import { userResolvers } from './userResolvers';
import { loadGroupResolvers } from './groupResolvers';
import { friendsResolvers } from './friendsResolvers';
import { directMessagingResolvers } from './directMessagingResolvers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const loadResolvers: () => Promise<IResolvers<any, any>> = async () =>
    mergeResolvers([
        userResolvers,
        await loadGroupResolvers(),
        friendsResolvers,
        directMessagingResolvers,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ]) as IResolvers<any, any>;
