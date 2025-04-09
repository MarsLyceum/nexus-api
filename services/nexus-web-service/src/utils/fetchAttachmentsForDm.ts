import { Message } from 'direct-messaging-api-client';

import { getCachedSignedUrl } from './getCachedSignedUrl';

export const fetchAttachmentsForDm = async (message: Message) => {
    const { attachmentFilePaths, ...messageWithoutFilePaths } = message;

    if (!attachmentFilePaths) {
        return {
            ...messageWithoutFilePaths,
            attachmentUrls: [],
        };
    }

    const attachmentUrls = await Promise.all(
        attachmentFilePaths.map(async (attachmentFilePath: string) =>
            getCachedSignedUrl('dm-attachments', attachmentFilePath)
        )
    );

    // Fallback if no data is returned
    return {
        ...messageWithoutFilePaths,
        attachmentUrls,
    };
};
