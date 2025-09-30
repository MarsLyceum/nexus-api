import { TextChannelMessage } from 'group-api-client';

import { getCachedSignedUrl } from './getCachedSignedUrl';

export const fetchAttachmentsForTextChannelMessage = async (
    message: TextChannelMessage
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
