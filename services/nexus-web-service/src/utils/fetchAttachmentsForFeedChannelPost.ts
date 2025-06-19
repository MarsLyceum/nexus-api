import { FeedChannelPost } from 'group-api-client';

import { getCachedSignedUrl } from './getCachedSignedUrl';

export const fetchAttachmentsForFeedChannelPost = async (
    post: FeedChannelPost
) => {
    const { attachmentFilePaths, ...messageWithoutFilePaths } = post;

    if (!attachmentFilePaths) {
        return {
            ...messageWithoutFilePaths,
            attachmentUrls: [],
        };
    }

    const attachmentUrls = await Promise.all(
        attachmentFilePaths.map(async (attachmentFilePath: string) =>
            getCachedSignedUrl('nexus-post-attachments', attachmentFilePath)
        )
    );

    // Fallback if no data is returned
    return {
        ...messageWithoutFilePaths,
        attachmentUrls,
    };
};
