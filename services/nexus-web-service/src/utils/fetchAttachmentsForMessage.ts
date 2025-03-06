import { GroupChannelMessage } from 'group-api-client';

import { getCachedSignedUrl } from './getCachedSignedUrl';

export const fetchAttachmentsForMessage = async (
    message: GroupChannelMessage
) => {
    const { attachmentFilePaths, ...messageWithoutFilePaths } = message;

    if (!attachmentFilePaths) {
        return {
            ...messageWithoutFilePaths,
            attachmentUrls: [],
        };
    }

    const attachmentUrls = await Promise.all(
        attachmentFilePaths.map(async (attachmentFilePath: string) =>
            getCachedSignedUrl('message-attachments', attachmentFilePath)
        )
    );

    // Fallback if no data is returned
    return {
        ...messageWithoutFilePaths,
        attachmentUrls,
    };
};
