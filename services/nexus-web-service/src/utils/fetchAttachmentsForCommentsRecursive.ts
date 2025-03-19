import {
    GroupChannelPostComment,
    GroupChannelPostCommentWithAttachmentUrls,
} from 'group-api-client';

import { fetchAttachmentsForComment } from './fetchAttachmentsForComment';

export async function fetchAttachmentsForCommentsRecursive(
    comment: GroupChannelPostComment
): Promise<GroupChannelPostCommentWithAttachmentUrls> {
    // Process the current comment
    const updatedComment = await fetchAttachmentsForComment(comment);

    // Check if the comment has children, then process them recursively
    if (updatedComment.children && updatedComment.children.length > 0) {
        updatedComment.children = await Promise.all(
            updatedComment.children.map((child) =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                fetchAttachmentsForCommentsRecursive(child)
            )
        );
    }

    return updatedComment;
}
