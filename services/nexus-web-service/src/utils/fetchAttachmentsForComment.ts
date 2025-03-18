import {
    GroupChannelPostComment,
    GroupChannelPostCommentWithAttachmentUrls,
} from 'group-api-client';

import { getCachedSignedUrl } from './getCachedSignedUrl';

export const fetchAttachmentsForComment = async (
    comment: GroupChannelPostComment
): Promise<GroupChannelPostCommentWithAttachmentUrls> => {
    const { attachmentFilePaths, ...rest } = comment;

    if (!attachmentFilePaths) {
        return {
            ...rest,
            attachmentUrls: [],
        };
    }

    const attachmentUrls = await Promise.all(
        attachmentFilePaths.map(async (attachmentFilePath: string) =>
            getCachedSignedUrl('nexus-comment-attachments', attachmentFilePath)
        )
    );

    // Fallback if no data is returned
    return {
        ...rest,
        attachmentUrls,
    };
};
